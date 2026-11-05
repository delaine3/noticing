import assert from "node:assert/strict";
import { test } from "node:test";
import { extractLocalRecords } from "../app/lib/free-capture.ts";

const date = "2026-11-03";

test("the example walk and garden task yields two separate reviewable records", () => {
  const parsed = extractLocalRecords("Today I walked 5 km and watered my garden", date);
  assert.equal(parsed.proposed_records.length, 2);
  assert.deepEqual(parsed.proposed_records.map((record) => record.log_type), ["Movement", "Plant care"]);
  assert.equal(parsed.proposed_records[0].action_date, date);
  assert.equal(parsed.proposed_records[0].notes, "Distance recorded: 5 km.");
});

test("reported yoghurt retains 7am rather than inventing first-meal status", () => {
  const parsed = extractLocalRecords("I ate yoghurt at 7am today", date);
  assert.equal(parsed.proposed_records.length, 1);
  assert.equal(parsed.proposed_records[0].log_type, "Meal");
  assert.equal(parsed.proposed_records[0].title, "Ate yoghurt");
  assert.equal(parsed.proposed_records[0].action_time, "07:00");
  assert.equal(parsed.proposed_records[0].action_date, date);
});

test("just-drank water needs no language model", () => {
  const result = extractLocalRecords("I just drank 500ml water", date);
  assert.equal(result.proposed_records.length, 1);
  assert.equal(result.proposed_records[0].log_type, "Water");
  assert.equal(result.proposed_records[0].water_amount_ml, 500);
});

test("just-had coffee needs no language model", () => {
  const result = extractLocalRecords("I've just had 250ml of coffee", date);
  assert.equal(result.proposed_records.length, 1);
  assert.equal(result.proposed_records[0].log_type, "Coffee");
  assert.equal(result.proposed_records[0].water_amount_ml, 250);
});

test("just-ate fruit salad needs no language model", () => {
  const result = extractLocalRecords("I just ate a fruit salad", date);
  assert.equal(result.proposed_records.length, 1);
  assert.equal(result.proposed_records[0].log_type, "Meal");
  assert.equal(result.proposed_records[0].title, "Ate a fruit salad");
});

test("future plans and hypotheticals are not saved as completed meals", () => {
  for (const text of ["I want to eat a fruit salad", "What if I ate a salad?", "I ate nothing"]) {
    assert.equal(extractLocalRecords(text, date).proposed_records.length, 0, text);
  }
});
