export type SourceLineRange = { startLine: number; endLine: number };

export function findSelectedLineRange(source: string, selectedText: string): SourceLineRange | undefined {
  const needle = normalizeText(selectedText);
  if (!needle) return undefined;

  const exactOffset = source.indexOf(selectedText);
  if (exactOffset >= 0) {
    const startLine = lineAtOffset(source, exactOffset);
    const endLine = lineAtOffset(source, exactOffset + selectedText.length);
    return { startLine, endLine };
  }

  const lines = source.split('\n');
  const visibleLines = lines.map(toVisibleText);
  let best: SourceLineRange | undefined;
  for (let startLine = 0; startLine < visibleLines.length; startLine += 1) {
    let candidate = '';
    for (let endLine = startLine; endLine < visibleLines.length; endLine += 1) {
      candidate += ` ${visibleLines[endLine]}`;
      const normalizedCandidate = normalizeText(candidate);
      if (normalizedCandidate.includes(needle)) {
        if (!best || endLine - startLine < best.endLine - best.startLine) best = { startLine, endLine };
        break;
      }
      if (normalizedCandidate.length > needle.length * 3 + 160) break;
    }
  }
  return best;
}

function lineAtOffset(source: string, offset: number): number {
  return source.slice(0, Math.max(0, offset)).split('\n').length - 1;
}

function normalizeText(value: string): string {
  return value.replace(/[\u200b-\u200d\ufeff]/g, '').replace(/\s+/g, ' ').trim();
}

function toVisibleText(line: string): string {
  return line
    .replace(/^\s{0,3}(?:#{1,6}|>|[-+*]|\d+[.)])\s+/, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_~`]/g, '')
    .replace(/<[^>]+>/g, ' ');
}
