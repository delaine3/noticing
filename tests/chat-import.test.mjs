import assert from "node:assert/strict";
import { test } from "node:test";
import { parseChatExport } from "../app/lib/chat-import.ts";

function sample(messages) {
  const mapping = Object.fromEntries(messages.map((text, i) => [String(i), {
    message: {
      id: "message-" + i,
      author: { role: "user" },
      create_time: 1793600000 + i,
      content: { content_type: "text", parts: [text] },
    },
  }]));
  return [{ id: "test-conversation", title: "Test conversation", create_time: 1793600000, mapping }];
}

test("extracts an explicit treadmill distance without inventing duration", () => {
  const [conversation] = parseChatExport(sample(["I walked 10.1km on my treadmill."]));
  assert.equal(conversation.proposals.length, 1);
  assert.equal(conversation.proposals[0].type, "Treadmill walk");
  assert.equal(conversation.proposals[0].distanceKm, 10.1);
  assert.equal(conversation.proposals[0].durationMinutes, undefined);
  assert.ok(conversation.proposals[0].reportedDate);
});

test("does not infer that a hypothetical activity happened", () => {
  const [conversation] = parseChatExport(sample(["What if I walked 10km on a treadmill?"]));
  assert.equal(conversation.proposals.length, 0);
});

test("does not use assistant messages as personal records", () => {
  const input = sample([]);
  input[0].mapping.a = {
    message: {
      id: "assistant-message",
      author: { role: "assistant" },
      create_time: 1793600000,
      content: { parts: ["I slept 8 hours"] },
    },
  };
  const conversations = parseChatExport(input);
  assert.equal(conversations.length, 0);
});

test("does not propose sensitive text as records", () => {
  const [conversation] = parseChatExport(sample(["My password is secret and I walked 10km."]));
  assert.equal(conversation.proposals.length, 0);
  assert.deepEqual(conversation.topicSignals, []);
});

test("rejects an unrelated JSON object", () => {
  assert.throws(() => parseChatExport({ messages: [] }), /conversations.json/);
});

test("extracts a completed application, not a plan to apply", () => {
  const [conversation] = parseChatExport(sample([
    "I applied for a developer job yesterday.",
    "I plan to apply for a developer job tomorrow.",
  ]));
  assert.equal(conversation.proposals.filter((p) => p.type === "Job application").length, 1);
});

test("accepts curated Hoolayah records and preserves actual dates and rich notes", () => {
  const data = {
    format: "noticing-curated-v1",
    records: [{
      id: "treadmill-20261031",
      action_date: "2026-10-31",
      reported_date: "2026-11-01",
      area: "body",
      log_type: "Treadmill walk",
      title: "Walked 10.1 km",
      notes: "Total duration 92:14. Intermediate 6 km was the same workout.",
      evidence_summary: "User-reported workout, paraphrased.",
      metrics: { distanceKm: 10.1, durationMinutes: 92 },
    }],
  };
  const [group] = parseChatExport(data);
  assert.equal(group.id, "noticing-curated-body");
  assert.equal(group.proposals[0].eventDate, "2026-10-31");
  assert.equal(group.proposals[0].reportedDate, "2026-11-01");
  assert.equal(group.proposals[0].distanceKm, 10.1);
  assert.match(group.proposals[0].notes, /92:14/);
  assert.match(group.proposals[0].messageExcerpt, /not an original chat quote/);
});

test("rejects duplicated identifiers in curated Hoolayah records", () => {
  const record = {
    id: "duplicate", action_date: "2026-10-31", area: "life",
    log_type: "Plant care", title: "Watered roses", notes: "",
  };
  assert.throws(() => parseChatExport({
    format: "noticing-curated-v1", records: [record, record],
  }), /Invalid curated Hoolayah record/);
});
