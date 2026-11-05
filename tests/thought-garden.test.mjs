import assert from "node:assert/strict";
import { test } from "node:test";
import {
  safeMonth, monthBounds, shiftMonth, monthIsComplete,
  bouquetThoughts, flowerForThought,
} from "../app/lib/thought-garden.ts";

test("month navigation handles year boundaries and leap years", () => {
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
  assert.equal(shiftMonth("2026-12", 1), "2027-01");
  assert.deepEqual(monthBounds("2024-02"), { start: "2024-02-01", next: "2024-03-01" });
  assert.equal(safeMonth("2026-13", "2026-11"), "2026-11");
  assert.equal(safeMonth("2026-02", "2026-11"), "2026-02");
});

test("bouquet blooms at month's end or in past months only", () => {
  assert.equal(monthIsComplete("2026-10", "2026-11-05"), true);
  assert.equal(monthIsComplete("2026-11", "2026-11-05"), false);
  assert.equal(monthIsComplete("2026-11", "2026-11-30"), true);
  assert.equal(monthIsComplete("2024-02", "2024-02-29"), true);
  assert.equal(monthIsComplete("2026-12", "2026-11-30"), false);
});

test("only actually written, saved thoughts become bouquet flowers", () => {
  const entries = [
    { id: "one", kind: "checkin", title: "A note", body: "University classes were optional.",
      entryDate: "2026-11-03", recordedAt: "2026-11-03", topic: "everyday", status: "saved" },
    { id: "two", kind: "journal", title: "Draft", body: "A future plan", entryDate: "2026-11-04",
      recordedAt: "2026-11-04", topic: "journal", status: "draft" },
    { id: "three", kind: "checkin", title: "Ratings", body: "", entryDate: "2026-11-05",
      recordedAt: "2026-11-05", topic: "worries", status: "saved" },
  ];
  const flowers = bouquetThoughts(entries);
  assert.equal(flowers.length, 1);
  assert.equal(flowers[0].id, "one");
  assert.deepEqual(flowerForThought(entries[0]), flowerForThought(entries[0]));
});
