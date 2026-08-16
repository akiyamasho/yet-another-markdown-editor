import type { EditorView } from '@milkdown/kit/prose/view';

export type EmojiEntry = { emoji: string; shortcode: string; label: string; keywords?: string[] };

// A deliberately small, high-signal set keeps the webview quick. Shortcodes are
// GitHub-compatible and the matching API makes adding more entries trivial.
export const EMOJI_DATA: readonly EmojiEntry[] = [
  ['😀','grinning','grinning face'],['😃','smiley','grinning face with big eyes'],['😄','smile','beaming face'],['😁','grin','beaming face with smiling eyes'],['😂','joy','face with tears of joy'],['🤣','rofl','rolling on the floor laughing'],['😊','blush','smiling face with smiling eyes'],['🙂','slightly_smiling_face','slightly smiling face'],['😉','wink','winking face'],['😍','heart_eyes','smiling face with heart-eyes'],['🥰','smiling_face_with_three_hearts','smiling face with hearts'],['😘','kissing_heart','face blowing a kiss'],['😎','sunglasses','smiling face with sunglasses'],['🤔','thinking','thinking face'],['🤗','hugs','hugging face'],['😢','cry','crying face'],['😭','sob','loudly crying face'],['😡','rage','enraged face'],['😱','scream','face screaming in fear'],['🤯','exploding_head','shocked face'],['😴','sleeping','sleeping face'],['🤩','star_struck','star-struck'],['🥳','partying_face','partying face'],['🤪','zany_face','zany face'],['👍','+1','thumbs up'],['👎','-1','thumbs down'],['👏','clap','clapping hands'],['🙌','raised_hands','raising hands'],['🙏','pray','folded hands'],['💪','muscle','flexed biceps'],['👀','eyes','eyes'],['❤️','heart','red heart'],['🧡','orange_heart','orange heart'],['💛','yellow_heart','yellow heart'],['💚','green_heart','green heart'],['💙','blue_heart','blue heart'],['💜','purple_heart','purple heart'],['🖤','black_heart','black heart'],['💔','broken_heart','broken heart'],['✨','sparkles','sparkles'],['🔥','fire','fire'],['⭐','star','star'],['🌟','star2','glowing star'],['🎉','tada','party popper'],['🎊','confetti_ball','confetti ball'],['✅','white_check_mark','check mark button'],['❌','x','cross mark'],['⚠️','warning','warning'],['💡','bulb','light bulb'],['💯','100','hundred points'],['🚀','rocket','rocket'],['🌈','rainbow','rainbow'],['☀️','sunny','sun'],['🌙','crescent_moon','crescent moon'],['☕','coffee','hot beverage'],['🍕','pizza','pizza'],['🍎','apple','red apple'],['🎂','birthday','birthday cake'],['⚽','soccer','soccer ball'],['🎸','guitar','guitar'],['📌','pushpin','pushpin'],['📎','paperclip','paperclip'],['✏️','pencil2','pencil'],['📚','books','books'],['💻','computer','laptop'],['📱','iphone','mobile phone'],['🔒','lock','locked'],['🔗','link','link'],['💬','speech_balloon','speech balloon'],['❤️','love','heart love']
].map(([emoji, shortcode, label]) => ({ emoji, shortcode, label }));

export type EmojiMatch = { entry: EmojiEntry; score: number };

export function matchEmojiQuery(query: string, limit = 8, data: readonly EmojiEntry[] = EMOJI_DATA): EmojiEntry[] {
  const needle = query.trim().toLowerCase().replace(/^:/, '').replace(/:$/, '');
  if (!needle) return data.slice(0, limit);
  return data.map((entry, index) => {
    const hay = `${entry.shortcode} ${entry.label} ${(entry.keywords ?? []).join(' ')}`.toLowerCase();
    const exact = entry.shortcode.toLowerCase() === needle;
    const starts = entry.shortcode.toLowerCase().startsWith(needle);
    const label = entry.label.toLowerCase().startsWith(needle);
    const includes = hay.includes(needle);
    return { entry, score: exact ? 0 : starts ? 1 : label ? 2 : includes ? 3 : 99, index };
  }).filter(item => item.score < 99).sort((a, b) => a.score - b.score || a.index - b.index).slice(0, limit).map(item => item.entry);
}

export type EmojiTrigger = { from: number; to: number; query: string; complete: boolean };

export function findEmojiTrigger(view: Pick<EditorView, 'state'>): EmojiTrigger | undefined {
  const { selection } = view.state;
  if (!selection.empty) return undefined;
  const $from = selection.$from;
  if ($from.parent.type.spec.code || $from.marks().some(mark => mark.type.spec.code)) return undefined;
  const before = $from.parent.textContent.slice(0, $from.parentOffset);
  const match = before.match(/(^|[\s([{\"'])(:[a-zA-Z0-9_+\-]*:?$)/);
  if (!match) return undefined;
  const token = match[2];
  return { from: selection.from - token.length, to: selection.to, query: token.slice(1).replace(/:$/, ''), complete: token.endsWith(':') };
}

export class EmojiAutocomplete {
  private view?: EditorView;
  private popup?: HTMLElement;
  private trigger?: EmojiTrigger;
  private results: EmojiEntry[] = [];
  private selected = 0;
  private applying = false;

  attach(view: EditorView): void {
    this.destroy();
    this.view = view;
    view.dom.addEventListener('input', this.onInput);
    view.dom.addEventListener('keydown', this.onKeyDown, true);
    document.addEventListener('selectionchange', this.onSelectionChange);
    this.refresh();
  }

  destroy(): void {
    if (this.view) {
      this.view.dom.removeEventListener('input', this.onInput);
      this.view.dom.removeEventListener('keydown', this.onKeyDown, true);
    }
    document.removeEventListener('selectionchange', this.onSelectionChange);
    this.popup?.remove(); this.popup = undefined; this.view = undefined; this.trigger = undefined;
  }

  private onInput = (): void => { if (!this.applying) this.refresh(); };
  private onSelectionChange = (): void => { if (this.view?.hasFocus()) this.refresh(); };
  private onKeyDown = (event: KeyboardEvent): void => {
    if (!this.popup || !this.results.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); event.stopPropagation();
      this.selected = (this.selected + (event.key === 'ArrowDown' ? 1 : this.results.length - 1)) % this.results.length; this.render(); return;
    }
    if (event.key === 'Enter' || event.key === 'Tab') { event.preventDefault(); event.stopPropagation(); this.choose(this.selected); return; }
    if (event.key === 'Escape') { event.preventDefault(); this.close(); }
  };

  private refresh(): void {
    if (!this.view) return;
    const trigger = findEmojiTrigger(this.view);
    if (!trigger) { this.close(); return; }
    const results = matchEmojiQuery(trigger.query);
    if (trigger.complete) {
      const exact = results.find(entry => entry.shortcode.toLowerCase() === trigger.query.toLowerCase());
      if (exact) { this.replace(exact, trigger); return; }
    }
    if (!results.length) { this.close(); return; }
    this.trigger = trigger; this.results = results; this.selected = Math.min(this.selected, results.length - 1); this.render();
  }

  private render(): void {
    if (!this.view || !this.trigger) return;
    if (!this.popup) {
      this.popup = document.createElement('div'); this.popup.className = 'notion-emoji-popup'; this.popup.setAttribute('role', 'listbox'); this.popup.id = 'notion-emoji-list';
      document.body.appendChild(this.popup);
    }
    this.popup.replaceChildren(...this.results.map((entry, index) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'notion-emoji-option'; button.setAttribute('role', 'option'); button.setAttribute('aria-selected', String(index === this.selected));
      button.innerHTML = `<span class="notion-emoji-glyph">${entry.emoji}</span><span class="notion-emoji-label"><span>${entry.label}</span><small>:${entry.shortcode}:</small></span>`;
      button.addEventListener('mousedown', event => { event.preventDefault(); this.choose(index); }); return button;
    }));
    const coords = this.view.coordsAtPos(this.view.state.selection.from);
    const width = this.popup.offsetWidth || 260;
    const height = this.popup.offsetHeight || 240;
    const below = coords.bottom + 6;
    const top = below + height <= window.innerHeight - 8
      ? below
      : Math.max(8, coords.top - height - 6);
    this.popup.style.left = `${Math.max(8, Math.min(coords.left, window.innerWidth - width - 8))}px`;
    this.popup.style.top = `${top}px`;
  }

  private choose(index: number): void { const entry = this.results[index]; if (entry && this.trigger) this.replace(entry, this.trigger); }
  private replace(entry: EmojiEntry, trigger: EmojiTrigger): void {
    if (!this.view) return;
    this.applying = true; this.view.dispatch(this.view.state.tr.insertText(entry.emoji, trigger.from, trigger.to).scrollIntoView()); this.applying = false; this.close(); this.view.focus();
  }
  private close(): void { this.popup?.remove(); this.popup = undefined; this.trigger = undefined; this.results = []; this.selected = 0; }
}
