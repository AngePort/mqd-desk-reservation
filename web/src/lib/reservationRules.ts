export type TimeRange = {
  startAt: Date;
  endAt: Date;
};

// Allow long-running desk assignments (e.g. multi-year).
// This is a simple cap to prevent truly unbounded ranges.
export const MAX_RESERVATION_MINUTES = 10 * 365 * 24 * 60;

export function isValidTimeRange(range: TimeRange) {
  return range.startAt instanceof Date &&
    range.endAt instanceof Date &&
    Number.isFinite(range.startAt.getTime()) &&
    Number.isFinite(range.endAt.getTime()) &&
    range.startAt.getTime() < range.endAt.getTime();
}

export function isWithinMaxDuration(range: TimeRange, maxMinutes: number) {
  const ms = range.endAt.getTime() - range.startAt.getTime();
  if (!Number.isFinite(ms) || ms <= 0) return false;
  return ms <= maxMinutes * 60_000;
}

// Overlap rule: [aStart, aEnd) overlaps [bStart, bEnd) iff aStart < bEnd && aEnd > bStart
export function rangesOverlap(a: TimeRange, b: TimeRange) {
  return a.startAt.getTime() < b.endAt.getTime() && a.endAt.getTime() > b.startAt.getTime();
}

export function parseIsoDate(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return null;
  return d;
}
