import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { isFindShortcut } from '../src/webview/editor-behavior.ts';

test('find shortcut detection covers Cmd/Ctrl+F only', () => {
  assert.equal(isFindShortcut({ key: 'f', metaKey: true, ctrlKey: false, altKey: false, shiftKey: false }), true);
  assert.equal(isFindShortcut({ key: 'F', metaKey: false, ctrlKey: true, altKey: false, shiftKey: false }), true);
  assert.equal(isFindShortcut({ key: 'f', metaKey: true, ctrlKey: false, altKey: true, shiftKey: false }), false);
  assert.equal(isFindShortcut({ key: 'p', metaKey: true, ctrlKey: false, altKey: false, shiftKey: false }), false);
});

test('webview disables both persistent top bars and uses absolute heading shortcuts', () => {
  const source = fs.readFileSync('src/webview/index.ts', 'utf8');
  const behavior = fs.readFileSync('src/webview/editor-behavior.ts', 'utf8');
  assert.doesNotMatch(source, /top-bar\.css/);
  assert.match(source, /Feature\.TopBar\]: false/);
  assert.doesNotMatch(source, /<header class="yame-header"/);
  assert.match(behavior, /#\{1,6\}/);
  assert.match(behavior, /inputRuleSource\(rule/);
  assert.match(behavior, /key: 'Backspace'/);
});
