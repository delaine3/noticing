import assert from "node:assert/strict";
import { test } from "node:test";
import { dayInTimeZone } from "../app/lib/local-day.ts";

test("a date near UTC midnight follows Eswatini local calendar time", () => {
  const date = new Date("2026-11-04T23:30:00Z");
  assert.equal(dayInTimeZone("Africa/Mbabane", date), "2026-11-05");
  assert.equal(dayInTimeZone("America/Los_Angeles", date), "2026-11-04");
});
test("invalid time zones do not crash server rendering", () => {
  assert.equal(dayInTimeZone("not/a-real-zone", new Date("2026-11-04T23:30:00Z")), "2026-11-04");
});
