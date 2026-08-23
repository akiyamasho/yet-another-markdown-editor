import { inputRulesCtx, keymapCtx, SchemaReady } from '@milkdown/kit/core';
import { headingSchema } from '@milkdown/kit/preset/commonmark';
import { textblockTypeInputRule } from '@milkdown/kit/prose/inputrules';
import { joinTextblockBackward } from '@milkdown/kit/prose/commands';
import type { MilkdownPlugin } from '@milkdown/kit/ctx';

const headingInputRuleSource = /^(?<hashes>#+)\s$/;

function inputRuleSource(rule: { match?: RegExp }): string | undefined {
  return rule.match?.source;
}

/** Notion-style Markdown heading shortcuts: the typed hash count is absolute. */
export const notionHeadingBehavior: MilkdownPlugin = (ctx) => async () => {
  await ctx.wait(SchemaReady);

  const headingRule = textblockTypeInputRule(
    /^(?<hashes>#{1,6})\s$/,
    headingSchema.type(ctx),
    (match) => ({ level: match.groups?.hashes?.length ?? 1 })
  );
  const inputRules = ctx.get(inputRulesCtx);
  ctx.set(
    inputRulesCtx,
    inputRules.filter((rule) => inputRuleSource(rule as unknown as { match?: RegExp }) !== headingInputRuleSource.source).concat(headingRule)
  );

  const keymap = ctx.get(keymapCtx);
  const removeBackspaceGuard = keymap.add({
    key: 'Backspace',
    priority: 100,
    onRun: () => (state, dispatch, view) => {
      const { $from, empty } = state.selection;
      if (!empty || $from.parent.type.name !== 'heading' || $from.parentOffset !== 0) return false;

      // Keep base Backspace semantics (joining with the previous block), but
      // deliberately omit Milkdown's undoInputRule command. That command would
      // turn a just-created heading back into a paragraph or a lower heading.
      joinTextblockBackward(state, dispatch, view);
      return true;
    }
  });

  return () => {
    removeBackspaceGuard();
    ctx.set(inputRulesCtx, ctx.get(inputRulesCtx).filter((rule) => rule !== headingRule));
  };
};
