import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { clearPendingTextIfPersisted, isExternalDocumentChange, isSaveShortcut, shouldMountHostDocument } from '../src/sync.ts';

test('an empty initial document still mounts Crepe', () => {
  assert.equal(shouldMountHostDocument(false, undefined, '', ''), true);
  assert.equal(shouldMountHostDocument(true, '', '', ''), false);
});

test('external document changes sync, while WorkspaceEdit echoes do not', () => {
  assert.equal(isExternalDocumentChange('# external', '# local', '# pending'), true);
  assert.equal(isExternalDocumentChange('# pending', '# pending', '# pending'), false);
  assert.equal(isExternalDocumentChange('# pending', '# local', '# pending'), false);
  assert.equal(isExternalDocumentChange('# older', '# newer', '# newer', new Set(['# older'])), false);
  assert.equal(isExternalDocumentChange('# external', '# newer', '# newer', new Set(['# older'])), true);
});

test('an older save completion cannot clear newer pending editor text', () => {
  assert.equal(clearPendingTextIfPersisted('# newer', '# older'), '# newer');
  assert.equal(clearPendingTextIfPersisted('# older', '# older'), undefined);
  assert.equal(clearPendingTextIfPersisted(undefined, '# older'), undefined);
});

test('Cmd/Ctrl+S is recognized and unrelated shortcuts are ignored', () => {
  assert.equal(isSaveShortcut('s', true, false), true);
  assert.equal(isSaveShortcut('S', false, true), true);
  assert.equal(isSaveShortcut('s', false, false), false);
  assert.equal(isSaveShortcut('p', true, false), false);
});

test('packaged webview resources are referenced by CSP and ignored sources are excluded', () => {
  const extension = fs.readFileSync(path.join(process.cwd(), 'src/extension.ts'), 'utf8');
  const ignore = fs.readFileSync(path.join(process.cwd(), '.vscodeignore'), 'utf8');
  assert.match(extension, /joinPath\(this\.context\.extensionUri, 'dist', 'webview\.js'\)/);
  assert.match(extension, /joinPath\(this\.context\.extensionUri, 'media', 'editor-theme\.css'\)/);
  assert.match(extension, /script-src[^`]*\$\{script\}/);
  assert.match(extension, /stylesheet[^`]*\$\{theme\}/);
  assert.match(ignore, /^!dist\/\*\*$/m);
  assert.match(ignore, /^!media\/\*\*$/m);
  assert.match(ignore, /^src\/\*\*$/m);
});

test('inline code uses editor contrast colors and code blocks keep their own styling', () => {
  const theme = fs.readFileSync(path.join(process.cwd(), 'media/editor-theme.css'), 'utf8');
  assert.match(theme, /--nm-inline-code-bg:/);
  assert.match(theme, /\.ProseMirror code[\s\S]{0,300}color: var\(--nm-text\) !important/);
  assert.match(theme, /\.ProseMirror pre code[\s\S]{0,220}background: none !important/);
});

test('host save paths persist via document.save after applying edits', () => {
  const extension = fs.readFileSync(path.join(process.cwd(), 'src/extension.ts'), 'utf8');
  assert.match(extension, /applyEdit\(edit\)[\s\S]{0,220}document\.save\(\)/);
  assert.match(extension, /await document\.save\(\)[\s\S]{0,180}clearPendingTextIfPersisted/);
  assert.match(extension, /Unsaved changes \(press Ctrl\/Cmd\+S to save\)/);
});
