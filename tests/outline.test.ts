import assert from 'node:assert/strict';
import test from 'node:test';
import { collapsedBlockIndexes, headingOutline } from '../src/webview/outline.ts';

test('outline includes only H1 through H5 and preserves document order', () => {
  assert.deepEqual(headingOutline([
    { typeName: 'heading', level: 1, text: 'One' },
    { typeName: 'paragraph', text: 'body' },
    { typeName: 'heading', level: 6, text: 'Ignored' },
    { typeName: 'heading', level: 3, text: 'Three' }
  ]), [{ index: 0, level: 1, text: 'One' }, { index: 3, level: 3, text: 'Three' }]);
});

test('collapsed headings hide their section until the next same-or-higher heading', () => {
  const blocks = [
    { typeName: 'heading', level: 1 }, { typeName: 'paragraph' },
    { typeName: 'heading', level: 2 }, { typeName: 'paragraph' },
    { typeName: 'heading', level: 1 }, { typeName: 'paragraph' }
  ];
  assert.deepEqual([...collapsedBlockIndexes(blocks, new Set([0]))], [1, 2, 3]);
  assert.deepEqual([...collapsedBlockIndexes(blocks, new Set([2]))], [3]);
});
