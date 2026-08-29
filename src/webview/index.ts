import { Crepe } from '@milkdown/crepe';
import resetStyles from '@milkdown/crepe/theme/common/reset.css';
import proseMirrorStyles from '@milkdown/crepe/theme/common/prosemirror.css';
import blockEditStyles from '@milkdown/crepe/theme/common/block-edit.css';
import codeMirrorStyles from '@milkdown/crepe/theme/common/code-mirror.css';
import cursorStyles from '@milkdown/crepe/theme/common/cursor.css';
import imageBlockStyles from '@milkdown/crepe/theme/common/image-block.css';
import linkTooltipStyles from '@milkdown/crepe/theme/common/link-tooltip.css';
import listItemStyles from '@milkdown/crepe/theme/common/list-item.css';
import placeholderStyles from '@milkdown/crepe/theme/common/placeholder.css';
import toolbarStyles from '@milkdown/crepe/theme/common/toolbar.css';
import tableStyles from '@milkdown/crepe/theme/common/table.css';
import latexStyles from '@milkdown/crepe/theme/common/latex.css';
import crepeStyles from '@milkdown/crepe/theme/frame.css';
import { editorViewCtx, serializerCtx } from '@milkdown/kit/core';
import { TextSelection } from '@milkdown/kit/prose/state';
import type { Selection } from '@milkdown/kit/prose/state';
import type { EditorToHostMessage, HostToEditorMessage } from '../protocol';
import { isSaveShortcut, shouldMountHostDocument } from '../sync';
import { EmojiAutocomplete } from './emoji';
import { notionHeadingBehavior } from './editor-behavior';
import { collapsedBlockIndexes, headingOutline } from './outline';

declare function acquireVsCodeApi(): { postMessage(message: EditorToHostMessage): void };

const vscode = acquireVsCodeApi();
const root = document.getElementById('app');
let crepe: Crepe | undefined;
let currentText = '';
let applyingHostDocument = false;
let ready = false;
const emojiAutocomplete = new EmojiAutocomplete();
const collapsedHeadings = new Set<number>();

type SelectionSnapshot = { anchor: number; head: number; focused: boolean };

function snapshotSelection(): SelectionSnapshot | undefined {
  if (!crepe) return undefined;
  try {
    return crepe.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      return { anchor: view.state.selection.anchor, head: view.state.selection.head, focused: view.hasFocus() };
    });
  } catch { return undefined; }
}

function restoreSelection(snapshot: SelectionSnapshot | undefined): void {
  if (!snapshot || !crepe) return;
  try {
    crepe.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const max = Math.max(1, view.state.doc.content.size - 1);
      const anchor = Math.max(1, Math.min(snapshot.anchor, max));
      const head = Math.max(1, Math.min(snapshot.head, max));
      let selection: Selection;
      try {
        selection = TextSelection.create(view.state.doc, anchor, head);
      } catch {
        selection = TextSelection.near(view.state.doc.resolve(anchor));
      }
      view.dispatch(view.state.tr.setSelection(selection));
      if (snapshot.focused) {
        // Native focus with preventScroll avoids jumping the canvas while the
        // remounted document is restoring the user's caret.
        view.dom.focus({ preventScroll: true });
        view.focus();
      }
    });
  } catch { /* A concurrently disposed editor can no longer be restored. */ }
}

if (root) {
  const style = document.createElement('style');
  style.textContent = [
    resetStyles,
    proseMirrorStyles,
    blockEditStyles,
    codeMirrorStyles,
    cursorStyles,
    imageBlockStyles,
    linkTooltipStyles,
    listItemStyles,
    placeholderStyles,
    toolbarStyles,
    tableStyles,
    latexStyles,
    crepeStyles
  ].join('\n');
  // Keep Crepe's structural CSS before our VS Code-aware theme so the latter
  // can intentionally override typography, colors, and compact layout.
  document.head.insertBefore(style, document.head.querySelector('link[rel="stylesheet"]'));
  root.innerHTML = `<div class="yame-shell"><aside class="yame-outline" aria-label="Table of contents"><div class="yame-outline-header"><strong>Contents</strong><button id="outline-toggle" type="button" aria-expanded="true" title="Hide table of contents">Hide</button></div><nav id="outline-nav"></nav></aside><main class="yame-canvas"><section id="editor" class="yame-editor" aria-label="Markdown document"></section></main></div>`;
}

let selectionFrame = 0;
function selectionInsideEditor(): string | undefined {
  const selection = window.getSelection();
  const editor = document.querySelector('.ProseMirror');
  const anchor = selection?.anchorNode;
  if (!selection || !editor || !anchor || !editor.contains(anchor)) return undefined;
  if (selection.isCollapsed) return '';
  return selection.toString();
}

document.addEventListener('selectionchange', () => {
  cancelAnimationFrame(selectionFrame);
  selectionFrame = requestAnimationFrame(() => {
    const text = selectionInsideEditor();
    // Keep the last native selection while the context menu has focus. A
    // browser selection can otherwise briefly look empty during menu launch.
    if (text !== undefined) vscode.postMessage({ type: 'selection', text });
  });
});

document.addEventListener('contextmenu', () => {
  const text = selectionInsideEditor();
  if (text) vscode.postMessage({ type: 'selection', text });
}, true);

function refreshOutline(): void {
  const editor = document.querySelector('.ProseMirror');
  const nav = document.getElementById('outline-nav');
  if (!editor || !nav || !crepe) return;
  const blocks = Array.from(editor.children).map((element) => {
    const heading = element.matches('h1,h2,h3,h4,h5') ? element : undefined;
    return { typeName: heading ? 'heading' : 'block', level: heading ? Number(heading.tagName.slice(1)) : undefined, text: element.textContent ?? '' };
  });
  const entries = headingOutline(blocks);
  nav.replaceChildren();
  if (!entries.length) {
    const empty = document.createElement('p'); empty.className = 'yame-outline-empty'; empty.textContent = 'No headings yet'; nav.appendChild(empty);
  }
  for (const entry of entries) {
    const button = document.createElement('button');
    const row = document.createElement('div'); row.className = 'yame-outline-row';
    button.type = 'button'; button.className = 'yame-outline-item'; button.dataset.level = String(entry.level); button.textContent = entry.text; button.title = `Jump to ${entry.text}`;
    button.addEventListener('click', () => {
      const target = editor.children[entry.index] as HTMLElement | undefined;
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    const collapse = document.createElement('button'); collapse.type = 'button'; collapse.className = 'yame-outline-collapse';
    collapse.textContent = collapsedHeadings.has(entry.index) ? '▸' : '▾'; collapse.title = 'Collapse section';
    collapse.setAttribute('aria-label', `${collapsedHeadings.has(entry.index) ? 'Expand' : 'Collapse'} ${entry.text}`);
    collapse.setAttribute('aria-expanded', String(!collapsedHeadings.has(entry.index)));
    collapse.addEventListener('click', () => {
      if (collapsedHeadings.has(entry.index)) collapsedHeadings.delete(entry.index);
      else collapsedHeadings.add(entry.index);
      applyCollapsedBlocks(editor, blocks); refreshOutline();
    });
    row.append(collapse, button); nav.appendChild(row);
  }
  applyCollapsedBlocks(editor, blocks);
}

function applyCollapsedBlocks(editor: Element, blocks: Array<{ typeName: string; level?: number; text: string }>): void {
  const hidden = collapsedBlockIndexes(blocks, collapsedHeadings);
  Array.from(editor.children).forEach((element, index) => {
    (element as HTMLElement).classList.toggle('yame-collapsed-block', hidden.has(index));
  });
}

document.getElementById('outline-toggle')?.addEventListener('click', (event) => {
  const button = event.currentTarget as HTMLButtonElement;
  const outline = document.querySelector('.yame-outline');
  const expanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!expanded)); button.textContent = expanded ? 'Show' : 'Hide';
  button.title = expanded ? 'Show table of contents' : 'Hide table of contents';
  outline?.classList.toggle('is-hidden', expanded);
});

function setStatus(message: string, kind: 'info' | 'success' | 'error' = 'info'): void {
  const status = document.getElementById('editor-status');
  if (status) { status.textContent = message; status.dataset.kind = kind; }
}

async function mount(text: string): Promise<void> {
  if (!root) return;
  const previousSelection = snapshotSelection();
  emojiAutocomplete.destroy();
  if (crepe) await crepe.destroy();
  const editorRoot = document.getElementById('editor');
  if (!editorRoot) return;
  editorRoot.replaceChildren();
  currentText = text;
  applyingHostDocument = true;
  crepe = new Crepe({
    root: editorRoot,
    defaultValue: text,
    // Crepe's TopBar is intentionally disabled; keyboard shortcuts are the
    // editor's primary command surface.
    features: { [Crepe.Feature.AI]: false, [Crepe.Feature.TopBar]: false },
    featureConfigs: {
      [Crepe.Feature.ImageBlock]: {
        onUpload: readFileAsDataUrl,
        blockOnUpload: readFileAsDataUrl,
        inlineOnUpload: readFileAsDataUrl,
        proxyDomURL: (url: string) => url
      },
      [Crepe.Feature.Placeholder]: { text: 'Type / for commands…' }
    }
  });
  crepe.editor.use(notionHeadingBehavior);
  crepe.on((listener) => listener.markdownUpdated((_ctx, markdown) => {
    if (applyingHostDocument || markdown === currentText) return;
    currentText = markdown;
    // Block indexes can change when headings are edited; reset UI-only folding
    // rather than accidentally hiding a different block after an edit.
    collapsedHeadings.clear();
    vscode.postMessage({ type: 'update', text: markdown });
    setStatus('Unsaved changes', 'info');
    requestAnimationFrame(refreshOutline);
  }));
  try {
    await crepe.create();
    // Crepe may normalize equivalent Markdown while it constructs its document.
    // Treat that serialization as the initial baseline so opening a file never
    // creates an edit before the user changes anything.
    currentText = crepe.getMarkdown();
    // Install after Crepe creates its ProseMirror view. The helper owns all
    // listeners and is safe to tear down when an external document remounts.
    crepe.editor.action((ctx) => emojiAutocomplete.attach(ctx.get(editorViewCtx)));
    restoreSelection(previousSelection);
    requestAnimationFrame(refreshOutline);
    const editor = document.querySelector('.ProseMirror');
    if (editor) new MutationObserver(() => requestAnimationFrame(refreshOutline)).observe(editor, { childList: true });
    ready = true;
    applyingHostDocument = false;
    setStatus('Ready', 'success');
    vscode.postMessage({ type: 'focus' });
  } catch (error) {
    applyingHostDocument = false;
    setStatus('Unable to load editor', 'error');
    vscode.postMessage({ type: 'status', message: error instanceof Error ? error.message : String(error) });
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read image.'));
    reader.readAsDataURL(file);
  });
}

type ActiveBlock = { view: import('@milkdown/kit/prose/view').EditorView; node: import('@milkdown/kit/prose/model').Node; pos: number; index: number };

function activeBlock(): ActiveBlock | undefined {
  if (!crepe || !ready) return undefined;
  try {
    return crepe.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const { $from } = view.state.selection;
      if ($from.depth < 1) return undefined;
      const index = $from.index(0);
      const node = view.state.doc.child(index);
      return { view, node, pos: $from.before(1), index };
    });
  } catch { return undefined; }
}

function serializeBlock(block: ActiveBlock): string {
  try { return crepe?.editor.action((ctx) => ctx.get(serializerCtx)(block.node).trimEnd()) ?? ''; }
  catch { return ''; }
}

async function copyActiveBlock(): Promise<void> {
  const block = activeBlock();
  if (!block) { setStatus('Select a block first', 'info'); return; }
  const markdown = serializeBlock(block);
  if (!markdown) { setStatus('That block has no Markdown to copy', 'info'); return; }
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(markdown);
    else throw new Error('Clipboard API unavailable');
    setStatus('Block copied', 'success');
  } catch {
    const area = document.createElement('textarea');
    area.value = markdown; area.setAttribute('readonly', ''); area.style.position = 'fixed'; area.style.opacity = '0';
    document.body.appendChild(area); area.select();
    const copied = document.execCommand?.('copy') ?? false;
    area.remove();
    setStatus(copied ? 'Block copied' : 'Could not copy block — check clipboard permissions', copied ? 'success' : 'error');
  }
}

function duplicateActiveBlock(): void {
  const block = activeBlock();
  if (!block) { setStatus('Select a block first', 'info'); return; }
  try {
    const tr = block.view.state.tr.insert(block.pos + block.node.nodeSize, block.node.copy(block.node.content));
    block.view.dispatch(tr.scrollIntoView());
    setStatus('Block duplicated', 'success');
  } catch { setStatus('Could not duplicate this block', 'error'); }
}

function deleteActiveBlock(): void {
  const block = activeBlock();
  if (!block) { setStatus('Select a block first', 'info'); return; }
  const doc = block.view.state.doc;
  const end = block.pos + block.node.nodeSize;
  try {
    const tr = doc.childCount > 1
      ? block.view.state.tr.delete(block.pos, end)
      : block.view.state.tr.replaceWith(block.pos, end, block.view.state.schema.nodes.paragraph.create());
    block.view.dispatch(tr.scrollIntoView());
    setStatus('Block deleted', 'success');
  } catch { setStatus('Could not delete this block', 'error'); }
}

window.addEventListener('message', async (event: MessageEvent<HostToEditorMessage>) => {
  const message = event.data;
  if (message.type === 'document') {
    // Host echoes from our own debounced edit are intentionally ignored. External
    // edits are mounted afresh so Markdown remains the source of truth.
    const editorText = crepe?.getMarkdown() ?? currentText;
    if (!shouldMountHostDocument(Boolean(crepe), editorText, currentText, message.text)) { ready = true; return; }
    setStatus('Updating…', 'info');
    await mount(message.text);
  } else if (message.type === 'status') {
    setStatus(message.message, message.kind ?? 'info');
  } else if (message.type === 'error') {
    setStatus(message.message, 'error');
  }
});

window.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.shiftKey && !event.altKey) {
    if (event.key.toLowerCase() === 'c') { event.preventDefault(); void copyActiveBlock(); return; }
    if (event.key.toLowerCase() === 'd') { event.preventDefault(); duplicateActiveBlock(); return; }
    if (event.key === 'Backspace' || event.key === 'Delete') { event.preventDefault(); deleteActiveBlock(); return; }
  }
  if (isSaveShortcut(event.key, event.ctrlKey, event.metaKey)) {
    event.preventDefault();
    vscode.postMessage({ type: 'save' });
    setStatus('Saving…', 'info');
  }
  if (event.key === 'Tab' && !event.shiftKey && document.activeElement?.closest('.milkdown')) {
    // ProseMirror handles list indentation; preventing browser focus traversal
    // makes Tab feel like a block editor when a list item is active.
    const inList = (event.target as HTMLElement | null)?.closest('li');
    if (inList) event.preventDefault();
  }
});

vscode.postMessage({ type: 'ready' });
