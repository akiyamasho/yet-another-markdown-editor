import assert from 'node:assert/strict';
import test from 'node:test';
import { findSelectedLineRange } from '../src/selection.ts';

test('maps an exact rendered selection to source lines', () => {
  const source = '# Heading\n\nFirst line\nsecond line\n';
  assert.deepEqual(findSelectedLineRange(source, 'First line\nsecond line'), { startLine: 2, endLine: 3 });
});

test('maps rendered text after Markdown markers are removed', () => {
  const source = '## Screenplay continuation\n\n- **Move blocks** quickly\n- Type `:rocket:` for emoji\n';
  assert.deepEqual(findSelectedLineRange(source, 'Screenplay continuation'), { startLine: 0, endLine: 0 });
  assert.deepEqual(
    findSelectedLineRange(source, 'Move blocks quickly Type :rocket: for emoji'),
    { startLine: 2, endLine: 3 }
  );
});

test('returns undefined for empty or unrelated selections', () => {
  assert.equal(findSelectedLineRange('# Heading', '  '), undefined);
  assert.equal(findSelectedLineRange('# Heading', 'Different text'), undefined);
});
