import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('repository-only Codex guidance is excluded from the VSIX', () => {
  const ignore = fs.readFileSync(path.join(process.cwd(), '.vscodeignore'), 'utf8');
  assert.match(ignore, /^\.codex\/\*\*$/m);
  assert.match(ignore, /^!dist\/\*\*$/m);
  assert.match(ignore, /^!media\/\*\*$/m);
});
