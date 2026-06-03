export interface GridDimensions {
  cols: number;
  rows: number;
}

/** Max grid columns by viewport width (matches Tailwind breakpoints). */
export function getMaxGridCols(viewportWidth: number): number {
  if (viewportWidth >= 1280) return 5;
  if (viewportWidth >= 1024) return 4;
  if (viewportWidth >= 640) return 3;
  return 2;
}

/** Participants per grid page before paginating (Google Meet–style). */
export function getTilesPerPage(viewportWidth: number): number {
  if (viewportWidth >= 1280) return 25;
  if (viewportWidth >= 1024) return 16;
  if (viewportWidth >= 640) return 9;
  return 6;
}

/** Thumbnails per spotlight filmstrip page (page dots, not per person). */
export function getFilmstripPerPage(viewportWidth: number): number {
  if (viewportWidth >= 1024) return 8;
  if (viewportWidth >= 640) return 6;
  return 4;
}

/** Max page dots shown before switching to numeric indicator. */
export const MAX_PAGE_DOTS = 5;

/**
 * Picks column/row counts so tiles fill the stage with minimal empty cells.
 * For 4 remotes on desktop this yields 2×2 when maxCols allows 2+ cols.
 */
export function getGridDimensions(
  tileCount: number,
  maxCols: number,
): GridDimensions {
  if (tileCount <= 0) return { cols: 1, rows: 1 };
  if (tileCount === 1) return { cols: 1, rows: 1 };

  const cappedMaxCols = Math.max(1, Math.min(maxCols, tileCount));
  let best: GridDimensions = { cols: cappedMaxCols, rows: Math.ceil(tileCount / cappedMaxCols) };
  let bestWaste = best.cols * best.rows - tileCount;

  for (let cols = 1; cols <= cappedMaxCols; cols += 1) {
    const rows = Math.ceil(tileCount / cols);
    const waste = cols * rows - tileCount;
    const aspectPenalty =
      rows > cols * 1.5 ? 0.5 : rows < cols * 0.5 ? 0.25 : 0;
    const score = waste + aspectPenalty;
    if (
      score < bestWaste ||
      (score === bestWaste && cols * rows < best.cols * best.rows)
    ) {
      best = { cols, rows };
      bestWaste = waste;
    }
  }

  return best;
}
