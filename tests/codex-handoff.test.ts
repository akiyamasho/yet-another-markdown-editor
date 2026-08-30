import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { runCodexHandoff } from '../src/codex-handoff.ts';

test('Codex handoff invokes only after the source editor is active and restores the custom editor', async () => {
  const events: string[] = [];
  const result = await runCodexHandoff({
    showSource: async () => { events.push('show'); return 'source'; },
    isActiveSource: editor => editor === 'source',
    invokeCodex: async () => { events.push('codex'); },
    copySelection: async () => { events.push('copy'); },
    reportFailure: message => events.push(`error:${message}`),
    restoreCustomEditor: async () => { events.push('restore'); }
  });
  assert.deepEqual(events, ['show', 'codex', 'restore']);
  assert.deepEqual(result, { success: true });
});

test('Codex handoff copies and reports a specific precondition failure, then restores', async () => {
  const events: string[] = [];
  const result = await runCodexHandoff({
    showSource: async () => { events.push('show'); return 'wrong-editor'; },
    isActiveSource: () => false,
    invokeCodex: async () => { events.push('codex'); },
    copySelection: async () => { events.push('copy'); },
    reportFailure: message => events.push(`error:${message}`),
    restoreCustomEditor: async () => { events.push('restore'); }
  });
  assert.equal(result.success, false);
  assert.deepEqual(events, [
    'show',
    'copy',
    'error:VS Code did not activate the Markdown source editor. The selected text was copied instead.',
    'restore'
  ]);
});

test('Codex wrapper is categorized and scoped to the rendered custom editor', () => {
  const manifest = JSON.parse(fs.readFileSync('package.json', 'utf8')) as {
    contributes: { commands: Array<{ command: string; title: string; category?: string; enablement?: string }>; menus: { commandPalette: Array<{ command: string; when: string }> } }
  };
  const command = manifest.contributes.commands.find(item => item.command === 'yetAnotherMarkdown.addSelectionToCodex');
  assert.equal(command?.title, 'Add to Codex Thread (Rendered Selection)');
  assert.equal(command?.category, 'Codex');
  assert.equal(command?.enablement, 'activeCustomEditorId == yetAnotherMarkdown.editor');
  assert.deepEqual(manifest.contributes.menus.commandPalette, [{
    command: 'yetAnotherMarkdown.addSelectionToCodex',
    when: 'activeCustomEditorId == yetAnotherMarkdown.editor'
  }]);
  assert.match(fs.readFileSync('src/extension.ts', 'utf8'), /runCodexHandoff/);
});

test('Codex handoff copies, reports, and restores when the native command throws', async () => {
  const events: string[] = [];
  const result = await runCodexHandoff({
    showSource: async () => { events.push('show'); return 'source'; },
    isActiveSource: () => true,
    invokeCodex: async () => { events.push('codex'); throw new Error('Codex command failed.'); },
    copySelection: async () => { events.push('copy'); },
    reportFailure: message => events.push(`error:${message}`),
    restoreCustomEditor: async () => { events.push('restore'); }
  });
  assert.equal(result.success, false);
  assert.deepEqual(events, [
    'show',
    'codex',
    'copy',
    'error:Codex command failed. The selected text was copied instead.',
    'restore'
  ]);
});
