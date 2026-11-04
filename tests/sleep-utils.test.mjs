import assert from "node:assert/strict";
import { test } from "node:test";
import { formatTimeInBed, getSleepNightStatus, sleepBenefitForDate, localClockParts } from "../app/lib/sleep-utils.ts";

test("cross-midnight bedtime and wake events count time in bed, not sleep", () => {
  const events = [
    { id: 1, log_type: "Bedtime", action_date: "2026-11-03", action_time: "21:30:00" },
    { id: 2, log_type: "Woke up", action_date: "2026-11-04", action_time: "05:45:00" },
  ];
  const state = getSleepNightStatus(events);
  assert.equal(state.pendingBedtime, null);
  assert.equal(state.lastNight.timeInBedMinutes, 495);
  assert.equal(formatTimeInBed(495), "8h 15m");
});

test("bedtime without wake stays pending, never invented sleep", () => {
  const state = getSleepNightStatus([
    { id: 3, log_type: "Bedtime", action_date: "2026-11-03", action_time: "22:00" },
  ]);
  assert.equal(state.pendingBedtime.id, 3);
  assert.equal(state.lastNight, null);
});

test("different dates rotate the nightly benefit", () => {
  assert.notEqual(sleepBenefitForDate("2026-11-04"), sleepBenefitForDate("2026-11-05"));
  assert.equal(localClockParts(new Date(2026, 10, 4, 21, 3)).time, "21:03");
});
