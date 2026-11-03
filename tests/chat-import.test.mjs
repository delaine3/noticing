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
