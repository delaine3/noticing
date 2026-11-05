import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyDetailReply, interpretClock, nextQuestion, summarizeRecords,
  understandActivity,
} from "../app/lib/assistant-intent.ts";
import { extractLocalRecords } from "../app/lib/free-capture.ts";

const now = new Date(2026, 10, 4, 21, 15);
const fallback = () => ({ reply: "", follow_up_question: null, proposed_records: [] });

test("coffee at 7am prompts for its amount and keeps the explicit time", () => {
  const [coffee] = understandActivity("I drank coffee at 7am", now, fallback);
  assert.equal(coffee.log_type, "Coffee");
  assert.equal(coffee.action_time, "07:00");
  assert.equal(coffee.action_date, "2026-11-04");
  assert.equal(coffee.water_amount_ml, null);
  assert.equal(nextQuestion([coffee]).field, "water_amount_ml");
  const pending = { records: [coffee], phase: "detail", requestedField: "water_amount_ml", requestedIndex: 0 };
  const updated = applyDetailReply(pending, "250 ml");
  assert.equal(updated.records[0].water_amount_ml, 250);
  assert.match(summarizeRecords(updated.records), /250 ml/);
});

test("explicit volume and time need no extra question", () => {
  const [coffee] = understandActivity("I had 200ml of coffee at 7:30am today", now, fallback);
  assert.equal(coffee.water_amount_ml, 200);
  assert.equal(coffee.action_time, "07:30");
  assert.equal(nextQuestion([coffee]), null);
});

test("going to bed is not falsely recorded as actual sleep", () => {
  const [bedtime] = understandActivity("I'm going to bed now", now, fallback);
  assert.equal(bedtime.log_type, "Bedtime");
  assert.equal(bedtime.action_time, "21:15");
  assert.equal(bedtime.sleep_hours, null);
});

test("wake-up and yesterday map to a correctly dated event", () => {
  const [wake] = understandActivity("I woke up at 6am yesterday", now, fallback);
  assert.equal(wake.log_type, "Woke up");
  assert.equal(wake.action_date, "2026-11-03");
  assert.equal(wake.action_time, "06:00");
});

test("hypotheticals aren't converted into completed activities", () => {
  assert.equal(understandActivity("What if I drank coffee at 7am?", now, fallback).length, 0);
});

test("clock parser recognizes midnight and noon", () => {
  assert.equal(interpretClock("at 12am"), "00:00");
  assert.equal(interpretClock("at 12pm"), "12:00");
});

test("a wake-up without time asks a useful follow-up and accepts plain 6am", () => {
  const [wake] = understandActivity("I woke up today", now, fallback);
  assert.equal(wake.action_time, "");
  const q = nextQuestion([wake]);
  assert.equal(q.field, "action_time");
  const pending = {
    records: [wake], phase: "detail", requestedField: q.field, requestedIndex: q.index,
  };
  const updated = applyDetailReply(pending, "6am");
  assert.equal(updated.records[0].action_time, "06:00");
  assert.equal(updated.phase, "confirm");
});

test("just drank 500ml water stays local, with volume and current time", () => {
  const records = understandActivity(
    "I just drank 500ml water", now,
    (text, date) => ({
      reply: "", follow_up_question: null,
      proposed_records: extractLocalRecords(text, date).proposed_records,
    }),
  );
  assert.equal(records.length, 1);
  assert.equal(records[0].log_type, "Water");
  assert.equal(records[0].water_amount_ml, 500);
  assert.equal(records[0].action_date, "2026-11-04");
  assert.equal(records[0].action_time, "21:15");
  assert.equal(nextQuestion(records), null);
});

test("common variations of immediate drink reports need no AI or extra questions", () => {
  for (const input of [
    "I just drank 500 ml of water",
    "I've just drunk 500ml water",
    "I have just had 500 ml of water",
    "I just had 500 ml water",
    "I just finished 500ml water",
  ]) {
    const records = understandActivity(input, now, fallback);
    assert.equal(records.length, 1, input);
    assert.equal(records[0].log_type, "Water", input);
    assert.equal(records[0].water_amount_ml, 500, input);
    assert.equal(records[0].action_time, "21:15", input);
    assert.equal(nextQuestion(records), null, input);
  }
});

test("an explicit time overrides now, and a past date never invents the present time", () => {
  const [timed] = understandActivity("I just drank 500ml water at 7am", now, fallback);
  assert.equal(timed.action_time, "07:00");
  const [yesterday] = understandActivity("I just drank 500ml water yesterday", now, fallback);
  assert.equal(yesterday.action_date, "2026-11-03");
  assert.equal(yesterday.action_time, "");
});

test("a hypothetical drink is not falsely saved", () => {
  assert.equal(understandActivity("What if I just drank 500ml water?", now, fallback).length, 0);
});
