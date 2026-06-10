export function parseRangeHeader(
  rangeHeader: string | undefined,
  totalSize: number,
): { start: number; end: number } | undefined {
  if (!rangeHeader || !rangeHeader.startsWith('bytes=')) return undefined;

  const spec = rangeHeader.slice('bytes='.length).trim();
  const [startStr, endStr] = spec.split('-', 2);
  if (!startStr) return undefined;

  const start = Number.parseInt(startStr, 10);
  if (!Number.isFinite(start) || start < 0) return undefined;

  let end: number;
  if (!endStr || endStr.length === 0) {
    end = totalSize - 1;
  } else {
    end = Number.parseInt(endStr, 10);
    if (!Number.isFinite(end) || end < start) return undefined;
  }

  if (start >= totalSize) return undefined;
  end = Math.min(end, totalSize - 1);
  return { start, end };
}
