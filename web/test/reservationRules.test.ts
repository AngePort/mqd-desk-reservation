import test from "node:test";
import assert from "node:assert/strict";

import { isValidTimeRange, rangesOverlap } from "../src/lib/reservationRules";

test("isValidTimeRange rejects invalid ranges", () => {
  assert.equal(
    isValidTimeRange({ startAt: new Date("2026-01-01T10:00:00Z"), endAt: new Date("2026-01-01T10:00:00Z") }),
    false,
  );
  assert.equal(
    isValidTimeRange({ startAt: new Date("invalid"), endAt: new Date("2026-01-01T11:00:00Z") }),
    false,
  );
  assert.equal(
    isValidTimeRange({ startAt: new Date("2026-01-01T10:00:00Z"), endAt: new Date("2026-01-01T11:00:00Z") }),
    true,
  );
});

test("rangesOverlap implements half-open interval overlap", () => {
  const a = { startAt: new Date("2026-01-01T10:00:00Z"), endAt: new Date("2026-01-01T11:00:00Z") };

  // Touching endpoints should NOT overlap
  const b = { startAt: new Date("2026-01-01T11:00:00Z"), endAt: new Date("2026-01-01T12:00:00Z") };
  assert.equal(rangesOverlap(a, b), false);

  // Partial overlap
  const c = { startAt: new Date("2026-01-01T10:30:00Z"), endAt: new Date("2026-01-01T11:30:00Z") };
  assert.equal(rangesOverlap(a, c), true);

  // Contained overlap
  const d = { startAt: new Date("2026-01-01T10:10:00Z"), endAt: new Date("2026-01-01T10:20:00Z") };
  assert.equal(rangesOverlap(a, d), true);

  // Disjoint
  const e = { startAt: new Date("2026-01-01T08:00:00Z"), endAt: new Date("2026-01-01T09:00:00Z") };
  assert.equal(rangesOverlap(a, e), false);
});
