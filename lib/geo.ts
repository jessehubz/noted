/** A viewport bounding box in degrees. West may be less than -180 or east
 * greater than 180 when the map has panned across the antimeridian. */
export interface BBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

/** Normalizes a longitude to the [-180, 180] range. */
export function normalizeLng(lng: number): number {
  let result = lng % 360;
  if (result > 180) result -= 360;
  if (result < -180) result += 360;
  return result;
}

/**
 * Splits a bounding box into one or two normalized ranges, handling the case
 * where the viewport wraps across the antimeridian (e.g. west=170, east=-170
 * after normalization actually means the box spans through 180/-180).
 */
export function splitBboxLongitude(
  bbox: BBox,
): { west: number; east: number }[] {
  const west = normalizeLng(bbox.west);
  const east = normalizeLng(bbox.east);

  if (bbox.east - bbox.west >= 360) {
    // Fully wrapped around the globe.
    return [{ west: -180, east: 180 }];
  }

  if (west <= east) {
    return [{ west, east }];
  }

  // Wraps across the antimeridian: split into two ranges.
  return [
    { west, east: 180 },
    { west: -180, east },
  ];
}

/** Formats an ISO timestamp as a short relative time, e.g. "2h ago". */
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSeconds = Math.max(0, Math.floor((now - then) / 1000));

  if (diffSeconds < 60) return "just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears}y ago`;
}

/** Returns a debounced version of `fn` that delays invocation by `delayMs`. */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number,
): (...args: Args) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  return (...args: Args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
}
