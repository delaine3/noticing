import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createLocalCompletionRequest,
  parseLocalCaptureResponse,
} from "../app/lib/local-capture-response.ts";

const allowedTypes = ["Movement", "Treadmill walk", "Sleep", "Plant care"];

test("local completion avoids the WebLLM json_object grammar matcher", () => {
  const request = createLocalCompletionRequest("Return JSON only", [
    { role: "user", content: "Today I walked 8 km." },
  ]);
  assert.equal("response_format" in request, false);
  assert.equal(request.messages[1].content, "Today I walked 8 km.");
  assert.equal(request.temperature, 0.1);
});

test("compact local JSON normalizes missing fields without inventing values", () => {
  const raw = JSON.stringify({
    reply: "One walk found.",
    follow_up_question: "When did you walk?",
    proposed_records: [{
      log_type: "Movement",
      title: "Walked 8 km",
      evidence: "I walked 8 km",
      action_date: "",
    }],
  });
  const data = parseLocalCaptureResponse(raw, allowedTypes);
  assert.equal(data.proposed_records.length, 1);
  assert.equal(data.proposed_records[0].action_date, "");
  assert.equal(data.proposed_records[0].treadmill_distance_km, null);
  assert.equal(data.proposed_records[0].mood_score, null);
  assert.equal(data.proposed_records[0].action_time, "");
  assert.equal(data.follow_up_question, "When did you walk?");
});

test("accepts JSON in a markdown fence without transmitting anything", () => {
  const text = '```json\n{"reply":"Done","follow_up_question":null,"proposed_records":[]}\n```';
  assert.deepEqual(parseLocalCaptureResponse(text, allowedTypes).proposed_records, []);
});

test("rejects invalid dates, bogus measurements and unknown activity categories", () => {
  const output = parseLocalCaptureResponse(JSON.stringify({
    reply: "Review",
    follow_up_question: null,
    proposed_records: [
      { log_type: "Sleep", title: "Slept", action_date: "2026-02-30", sleep_hours: 30, energy_score: 9.5 },
      { log_type: "Dangerous unknown type", title: "Invalid entry" },
    ],
  }), allowedTypes);
  assert.equal(output.proposed_records.length, 1);
  assert.equal(output.proposed_records[0].action_date, "");
  assert.equal(output.proposed_records[0].sleep_hours, null);
  assert.equal(output.proposed_records[0].energy_score, null);
});

test("fails explicitly for incomplete local JSON", () => {
  assert.throws(
    () => parseLocalCaptureResponse('{"reply":"broken", "proposed_records":[', allowedTypes),
    /incomplete JSON/,
  );
});
