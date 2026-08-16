import assert from 'node:assert/strict';
import test from 'node:test';
import { findEmojiTrigger, matchEmojiQuery } from '../src/webview/emoji.ts';

test('emoji matching ranks shortcode prefixes and caps candidates', () => {
  const results = matchEmojiQuery('smi', 8);
  assert.ok(results.length <= 8);
  assert.equal(results[0]?.shortcode, 'smiley');
  assert.ok(results.some(result => result.shortcode === 'smile'));
});

test('emoji matching accepts colon-wrapped input and labels', () => {
  assert.equal(matchEmojiQuery(':rocket:')[0]?.emoji, '🚀');
  assert.equal(matchEmojiQuery('party')[0]?.shortcode, 'partying_face');
});

function fakeView(text: string, offset = text.length, code = false) {
  const parent = { textContent: text, text: text, textBetween: () => text, type: { spec: { code } } };
  return { state: { selection: { empty: true, from: offset, to: offset, $from: { parent, parentOffset: offset, marks: () => [] } } } } as never;
}

test('trigger range covers the shortcode token and excludes ordinary colons', () => {
  assert.deepEqual(findEmojiTrigger(fakeView('hello :smil')), { from: 6, to: 11, query: 'smil', complete: false });
  assert.deepEqual(findEmojiTrigger(fakeView(':rocket:')), { from: 0, to: 8, query: 'rocket', complete: true });
  assert.equal(findEmojiTrigger(fakeView('http://example.com')), undefined);
});

test('trigger helper suppresses code blocks', () => {
  assert.equal(findEmojiTrigger(fakeView('const :smile', 12, true)), undefined);
});
