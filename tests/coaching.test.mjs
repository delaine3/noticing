import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getAdaptiveQuestions,
  recommendNextAction,
  assessHydration,
  validateCheckIn,
} from "../app/lib/coaching.ts";

function check(overrides = {}) {
  return {
    energy: 3, mood: 3, stress: 3, thought_topic: "everyday",
    thought_detail: null,
    recently_ate: null, thirsty: null, physical_discomfort: null,
    overwhelmed: null, thought_actionable: null, rested: null,
    ...overrides,
  };
}
test("ordinary check-ins don't trigger unnecessary questions", () => {
  assert.deepEqual(getAdaptiveQuestions(check()), []);
});
test("low energy and stress produce at most three relevant yes/no followups", () => {
  const questions = getAdaptiveQuestions(check({energy: 2, stress: 5, thought_topic: "worries"}));
  assert.ok(questions.length > 0 && questions.length <= 3);
  assert.ok(questions.some(q => q.key === "recently_ate"));
  assert.ok(questions.some(q => q.key === "thought_actionable"));
});
test("a low-energy person who hasn't eaten receives a food suggestion", () => {
  const next = recommendNextAction(check({energy: 1, recently_ate: false}));
  assert.equal(next.code, "eat");
  assert.match(next.benefit, /food|energy/i);
});
test("high stress with actionable worries yields one small task", () => {
  const next = recommendNextAction(check({stress: 5, thought_actionable: true}));
  assert.equal(next.code, "small_task");
});
test("thirst does not override clinician-directed fluid limits", () => {
  const next = recommendNextAction(check({thirsty: true}), {fluidRestricted: true});
  assert.notEqual(next.code, "drink");
  assert.match(next.next, /fluid allowance|guidance/i);
});
test("hydration at 500ml late in the day produces useful advice", () => {
  const status = assessHydration(500, 1800, 19, false, true);
  assert.equal(status.loggedMl, 500);
  assert.ok(status.fraction < 0.3);
  assert.match(status.guidance, /below your daily goal/i);
  assert.match(status.guidance, /glass of water/i);
});
test("early hydration is encouraged without treating 500ml as a failure", () => {
  const status = assessHydration(500, 1800, 9, false, false);
  assert.match(status.guidance, /Start the day/i);
});
test("fluid restrictions suppress drinking recommendations", () => {
  const status = assessHydration(500, 1800, 19, true, true);
  assert.doesNotMatch(status.guidance, /Have a glass/i);
  assert.match(status.guidance, /clinician/i);
});
test("a low value with incomplete records uses conditional advice", () => {
  const status = assessHydration(500, 1800, 19, false, false);
  assert.match(status.guidance, /If this is most/i);
});
test("check-in validation rejects invented values and excessive private text", () => {
  assert.equal(validateCheckIn(check()), true);
  assert.equal(validateCheckIn(check({stress: 11})), false);
  assert.equal(validateCheckIn(check({thought_detail: "x".repeat(601)})), false);
  assert.equal(validateCheckIn(check({thirsty: "yes"})), false);
});
