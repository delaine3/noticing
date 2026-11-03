import assert from "node:assert/strict";
import { test } from "node:test";
import { extractLocalRecords } from "../app/lib/free-capture.ts";
import { resolveLocalCapture } from "../app/lib/capture-result.ts";
import { parseLocalCaptureResponse } from "../app/lib/local-capture-response.ts";
const resolve = (raw, message, day, types) => resolveLocalCapture(raw, message, day, types, parseLocalCaptureResponse, extractLocalRecords);

const date = "2026-11-03";
const types = ["Movement", "Plant care", "Meal"];

test("the example walk and garden task yields two separate reviewable records", () => {
  const parsed = extractLocalRecords("Today I walked 5 km and watered my garden", date);
  assert.equal(parsed.proposed_records.length, 2);
  assert.deepEqual(parsed.proposed_records.map((record) => record.log_type), ["Movement", "Plant care"]);
  assert.equal(parsed.proposed_records[0].action_date, date);
  assert.equal(parsed.proposed_records[0].notes, "Distance recorded: 5 km.");
});

test("the reported yoghurt meal retains 7am rather than inventing a first meal", () => {
  const parsed = extractLocalRecords("i ate yoghurt at 7am today", date);
  assert.equal(parsed.proposed_records.length, 1);
  assert.equal(parsed.proposed_records[0].log_type, "Meal");
  assert.equal(parsed.proposed_records[0].title, "Ate yoghurt");
  assert.equal(parsed.proposed_records[0].action_time, "07:00");
  assert.equal(parsed.proposed_records[0].action_date, date);
});

test("a model returning only 1 does not become the assistant's reply", () => {
  const result = resolve("1", "Today I walked 5 km and watered my garden", date, types);
  assert.equal(result.usedBasic, true);
  assert.equal(result.analysis.proposed_records.length, 2);
  assert.doesNotMatch(result.analysis.reply, /^1$/);
});

test("a model that reports no activities cannot discard explicit offline detections", () => {
  const raw = JSON.stringify({ reply: "1", follow_up_question: null, proposed_records: [] });
  const result = resolve(raw, "i ate yoghurt at 7am today", date, types);
  assert.equal(result.usedBasic, true);
  assert.equal(result.analysis.proposed_records[0].action_time, "07:00");
});

test("a well-formed local model result is preserved", () => {
  const raw = JSON.stringify({
    reply: "I found one meal.",
    follow_up_question: null,
    proposed_records: [{ log_type: "Meal", title: "Ate yoghurt", action_date: date, action_time: "07:00", evidence: "i ate yoghurt" }],
  });
  const result = resolve(raw, "i ate yoghurt at 7am today", date, types);
  assert.equal(result.usedBasic, false);
  assert.equal(result.analysis.proposed_records.length, 1);
});

test("hypothetical events do not generate local fallback records", () => {
  const result = resolve("1", "What if I walked 5 km today?", date, types);
  assert.equal(result.analysis.proposed_records.length, 0);
});
