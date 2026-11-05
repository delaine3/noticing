import assert from "node:assert/strict";
import { test } from "node:test";
import {
  freeCloudConfigured, FREE_WORKERS_MODEL, cloudPrompt,
} from "../app/lib/free-cloud.ts";

test("Cloudflare is disabled when not explicitly confirmed as an unbilled Free plan", () => {
  const env = {
    CLOUDFLARE_ACCOUNT_ID: "a".repeat(32),
    CLOUDFLARE_WORKERS_AI_TOKEN: "example-secret-key",
  };
  assert.equal(freeCloudConfigured(env), false);
  assert.equal(freeCloudConfigured({...env, CLOUDFLARE_FREE_PLAN_CONFIRMED: "false"}), false);
  assert.equal(freeCloudConfigured({...env, CLOUDFLARE_FREE_PLAN_CONFIRMED: "true"}), true);
});
test("malformed account IDs and missing keys fail closed", () => {
  assert.equal(freeCloudConfigured({
    CLOUDFLARE_ACCOUNT_ID: "foo",
    CLOUDFLARE_WORKERS_AI_TOKEN: "not-a-secret",
    CLOUDFLARE_FREE_PLAN_CONFIRMED: "true",
  }), false);
  assert.equal(freeCloudConfigured({
    CLOUDFLARE_ACCOUNT_ID: "a".repeat(32),
    CLOUDFLARE_FREE_PLAN_CONFIRMED: "true",
  }), false);
});
test("Cloud AI is locked to a supported free Cloudflare-hosted Gemma model", () => {
  assert.equal(FREE_WORKERS_MODEL, "@cf/google/gemma-4-26b-a4b-it");
});
test("provider prompt extracts events rather than medical diagnoses or stored chat context", () => {
  const prompt = cloudPrompt("2026-11-05");
  assert.match(prompt, /completed first-person activities/);
  assert.match(prompt, /never|Never/);
  assert.match(prompt, /2026-11-05/);
  assert.doesNotMatch(prompt, /stored private check-ins/i);
});
