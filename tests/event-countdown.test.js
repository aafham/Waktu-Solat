import test from "node:test";
import assert from "node:assert/strict";
import { countdownParts } from "../event-countdown.js";

test("occasion countdown reaches today at Malaysia midnight regardless of device timezone", () => {
  assert.deepEqual(
    countdownParts("2026-03-21", new Date("2026-03-20T15:59:59Z")),
    { days: 0, hours: 0, minutes: 0, seconds: 1, today: false },
  );
  assert.deepEqual(
    countdownParts("2026-03-21", new Date("2026-03-20T16:00:00Z")),
    { days: 0, hours: 0, minutes: 0, seconds: 0, today: true },
  );
});

test("calendar countdown includes Gregorian leap day and separates days from hours", () => {
  assert.deepEqual(
    countdownParts("2024-03-01", new Date("2024-02-28T12:00:00+08:00")),
    { days: 1, hours: 12, minutes: 0, seconds: 0, today: false },
  );
});

test("past occasions never display negative countdown values", () => {
  assert.deepEqual(
    countdownParts("2026-03-21", new Date("2026-03-22T00:00:01+08:00")),
    { days: 0, hours: 0, minutes: 0, seconds: 0, today: false },
  );
});

test("countdown rejects invalid clock inputs instead of rendering NaN", () => {
  assert.throws(() => countdownParts("not-a-date"), RangeError);
  assert.throws(() => countdownParts("2026-03-21", new Date(NaN)), RangeError);
});
