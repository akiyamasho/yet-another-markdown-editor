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
import topBarStyles from '@milkdown/crepe/theme/common/top-bar.css';
import crepeStyles from '@milkdown/crepe/theme/frame.css';
import { editorViewCtx, serializerCtx } from '@milkdown/kit/core';
import type { EditorToHostMessage, HostToEditorMessage } from '../protocol';
import { isSaveShortcut, shouldMountHostDocument } from '../sync';
import { EmojiAutocomplete } from './emoji';

declare function acquireVsCodeApi(): { postMessage(message: EditorToHostMessage): void };

const vscode = acquireVsCodeApi();
const root = document.getElementById('app');
let crepe: Crepe | undefined;
let currentText = '';
let applyingHostDocument = false;
let ready = false;
const emojiAutocomplete = new EmojiAutocomplete();

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
    topBarStyles,
    crepeStyles
  ].join('\n');
  // Keep Crepe's structural CSS before our VS Code-aware theme so the latter
  // can intentionally override typography, colors, and compact layout.
  document.head.insertBefore(style, document.head.querySelector('link[rel="stylesheet"]'));
  root.innerHTML = `<div class="notion-shell"><header class="notion-header" role="toolbar" aria-label="Markdown editor"><span class="notion-title">Markdown</span><span class="notion-header-spacer"></span><span id="editor-status" class="notion-status">Loading…</span><div class="notion-toolbar"><button id="copy-block" type="button" title="Copy block (⌘/Ctrl+Shift+C)" aria-label="Copy block">Copy block</button><button id="duplicate-block" type="button" title="Duplicate block (⌘/Ctrl+Shift+D)" aria-label="Duplicate block">Duplicate</button><button id="delete-block" type="button" title="Delete block (⌘/Ctrl+Shift+Backspace)" aria-label="Delete block">Delete</button><button id="open-source" type="button" title="Open Markdown source">Source</button><button id="editor-help" type="button" title="Keyboard shortcuts" aria-label="Keyboard shortcuts">?</button></div></header><main class="notion-canvas"><section id="editor" class="notion-editor" aria-label="Markdown document"></section></main></div>`;
  document.getElementById('open-source')?.addEventListener('click', () => vscode.postMessage({ type: 'openSource' }));
  document.getElementById('copy-block')?.addEventListener('click', () => void copyActiveBlock());
  document.getElementById('duplicate-block')?.addEventListener('click', () => duplicateActiveBlock());
  document.getElementById('delete-block')?.addEventListener('click', () => deleteActiveBlock());
  document.getElementById('editor-help')?.addEventListener('click', () => {
    setStatus('⌘/Ctrl+Shift+C copy · D duplicate · Backspace delete · ⌘/Ctrl+B bold · / commands', 'info');
  });
}

function setStatus(message: string, kind: 'info' | 'success' | 'error' = 'info'): void {
  const status = document.getElementById('editor-status');
  if (status) { status.textContent = message; status.dataset.kind = kind; }
}

async function mount(text: string): Promise<void> {
  if (!root) return;
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
    // Crepe ships block handles, slash commands, selection toolbar, headings,
    // lists, tables, code blocks, links, images, and the persistent top bar.
    // TopBar is intentionally opt-in in Crepe; enable it for discoverable
    // formatting and block insertion controls.
    features: { [Crepe.Feature.AI]: false, [Crepe.Feature.TopBar]: true },
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
  crepe.on((listener) => listener.markdownUpdated((_ctx, markdown) => {
    if (applyingHostDocument || markdown === currentText) return;
    currentText = markdown;
    vscode.postMessage({ type: 'update', text: markdown });
    setStatus('Unsaved changes', 'info');
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
