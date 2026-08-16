import test from 'node:test';
import assert from 'node:assert/strict';
import { isEditorToHostMessage } from '../src/protocol.ts';

test('protocol accepts only well-formed editor messages', () => {
  assert.equal(isEditorToHostMessage({ type: 'ready' }), true);
  assert.equal(isEditorToHostMessage({ type: 'update', text: '# Hello' }), true);
  assert.equal(isEditorToHostMessage({ type: 'selection', text: 'Hello' }), true);
  assert.equal(isEditorToHostMessage({ type: 'addToCodex' }), true);
  assert.equal(isEditorToHostMessage({ type: 'status', message: 'Editing' }), true);
  assert.equal(isEditorToHostMessage({ type: 'update' }), false);
  assert.equal(isEditorToHostMessage({ type: 'update', text: 42 }), false);
  assert.equal(isEditorToHostMessage({ type: 'status', message: null }), false);
  assert.equal(isEditorToHostMessage({ type: 'unknown' }), false);
  assert.equal(isEditorToHostMessage([]), false);
  assert.equal(isEditorToHostMessage({ type: 'save', extra: true }), false);
});
