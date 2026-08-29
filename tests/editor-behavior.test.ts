import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('webview disables both persistent top bars and uses absolute heading shortcuts', () => {
  const source = fs.readFileSync('src/webview/index.ts', 'utf8');
  const behavior = fs.readFileSync('src/webview/editor-behavior.ts', 'utf8');
  assert.doesNotMatch(source, /top-bar\.css/);
  assert.match(source, /Feature\.TopBar\]: false/);
  assert.doesNotMatch(source, /<header class="yame-header"/);
  assert.doesNotMatch(source, /isFindShortcut/);
  assert.doesNotMatch(source, /stopPropagation\(\)/);
  assert.doesNotMatch(behavior, /isFindShortcut/);
  assert.match(behavior, /#\{1,6\}/);
  assert.match(behavior, /inputRuleSource\(rule/);
  assert.match(behavior, /key: 'Backspace'/);
});

test('external remounts preserve a focused, clamped ProseMirror selection', () => {
  const source = fs.readFileSync('src/webview/index.ts', 'utf8');
  assert.match(source, /snapshotSelection\(\)/);
  assert.match(source, /view\.state\.selection\.anchor/);
  assert.match(source, /view\.state\.selection\.head/);
  assert.match(source, /TextSelection\.create/);
  assert.match(source, /TextSelection\.near/);
  assert.match(source, /view\.dom\.focus\(\{ preventScroll: true \}\)/);
  assert.match(source, /restoreSelection\(previousSelection\)/);
});

test('native rendered selections survive context-menu focus changes', () => {
  const source = fs.readFileSync('src/webview/index.ts', 'utf8');
  assert.match(source, /selectionInsideEditor/);
  assert.match(source, /contextmenu/);
  assert.match(source, /text \|\| document\.hasFocus\(\)/);
  assert.match(source, /id="add-to-codex"/);
  assert.match(source, /pointerdown/);
  assert.match(fs.readFileSync('src/extension.ts', 'utf8'), /Do not discard a native selection/);
});

test('rendered selection action is contextual and uses the existing host bridge', () => {
  const source = fs.readFileSync('src/webview/index.ts', 'utf8');
  assert.match(source, /selectionAction\.hidden = !available/);
  assert.match(source, /type: 'addToCodex'/);
  assert.match(fs.readFileSync('src/extension.ts', 'utf8'), /findSelectedLineRange\(session\.latestText, selectedText\)/);
});

test('Codex handoff also accepts a matching active source-editor selection', () => {
  const source = fs.readFileSync('src/extension.ts', 'utf8');
  assert.match(source, /vscode\.window\.activeTextEditor/);
  assert.match(source, /activeEditor\.document\.getText\(activeEditor\.selection\)/);
  assert.match(source, /activeEditorKey === session\.document\.uri\.toString\(\)/);
  assert.match(source, /if \(nativeText && activeEditor\)/);
});
