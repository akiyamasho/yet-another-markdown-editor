export type OutlineHeading = {
  index: number;
  level: number;
  text: string;
};

export function headingOutline(blocks: Array<{ typeName: string; level?: number; text: string }>): OutlineHeading[] {
  return blocks.flatMap((block, index) => {
    if (block.typeName !== 'heading' || !block.level || block.level < 1 || block.level > 5) return [];
    return [{ index, level: block.level, text: block.text.trim() || 'Untitled heading' }];
  });
}

export function collapsedBlockIndexes(
  blocks: Array<{ typeName: string; level?: number }>,
  collapsed: Set<number>
): Set<number> {
  const hidden = new Set<number>();
  let hidingBelow: number | undefined;
  blocks.forEach((block, index) => {
    if (block.typeName === 'heading' && block.level !== undefined) {
      if (hidingBelow !== undefined && block.level <= hidingBelow) hidingBelow = undefined;
      if (hidingBelow !== undefined) hidden.add(index);
      if (collapsed.has(index)) hidingBelow = block.level;
    } else if (hidingBelow !== undefined) {
      hidden.add(index);
    }
  });
  return hidden;
}
