import assert from "node:assert/strict";
import { test } from "node:test";
import { getLogDisplayTitle } from "../app/lib/log-title.ts";

test("an empty log title is replaced with an informative activity label", () => {
  assert.equal(getLogDisplayTitle({ log_type: "Coffee", title: null, action_time: "07:00:00", water_amount_ml: 250 }), "Coffee · 250 ml at 07:00");
  assert.equal(getLogDisplayTitle({ log_type: "Bedtime", title: null, action_time: "21:05" }), "Getting ready for bed at 21:05");
  assert.equal(getLogDisplayTitle({ log_type: "Plant care", title: null }), "Cared for plants");
});
test("existing user-written titles are never replaced", () => {
  assert.equal(getLogDisplayTitle({ log_type: "Meal", title: "Peach and yoghurt" }), "Peach and yoghurt");
});
