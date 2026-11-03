import assert from "node:assert/strict";
import { test } from "node:test";
import { createLocalModelSession } from "../app/lib/local-model-session.ts";

test("a verified session is reused until invalidated", async () => {
  let created = 0;
  let unloaded = 0;
  const session = createLocalModelSession(async (modelId) => {
    created++;
    return { modelId, async unload() { unloaded++; } };
  });
  const first = await session.load("small", () => {});
  const second = await session.load("small", () => {});
  assert.equal(first, second);
  assert.equal(created, 1);
  await session.invalidate("small");
  assert.equal(unloaded, 1);
  const replacement = await session.load("small", () => {});
  assert.notEqual(replacement, first);
  assert.equal(created, 2);
});

test("switching models unloads the first engine before starting the second", async () => {
  const events = [];
  const session = createLocalModelSession(async (modelId) => {
    events.push("create:" + modelId);
    return { async unload() { events.push("unload:" + modelId); } };
  });
  await session.load("360M", () => {});
  await session.load("1.7B", () => {});
  assert.deepEqual(events, ["create:360M", "unload:360M", "create:1.7B"]);
});

test("failed verification never leaves a model falsely marked ready", async () => {
  let attempt = 0;
  const session = createLocalModelSession(async () => {
    attempt++;
    if (attempt === 1) throw new Error("Generation probe failed");
    return { async unload() {} };
  });
  await assert.rejects(session.load("model", () => {}), /probe failed/);
  assert.ok(await session.load("model", () => {}));
  assert.equal(attempt, 2);
});

test("invalidation of the wrong model does not unload an active engine", async () => {
  let unloadCount = 0;
  const session = createLocalModelSession(async () => ({
    async unload() { unloadCount++; },
  }));
  await session.load("current", () => {});
  await session.invalidate("old");
  assert.equal(unloadCount, 0);
  await session.invalidate("current");
  assert.equal(unloadCount, 1);
});
