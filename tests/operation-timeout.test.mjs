import assert from "node:assert/strict";
import { test } from "node:test";
import { withOperationTimeout, OperationTimeoutError } from "../app/lib/operation-timeout.ts";

test("returns immediately when local processing resolves", async () => {
  assert.equal(await withOperationTimeout(Promise.resolve("ready"), 200, "hung"), "ready");
});

test("a hung operation rejects instead of spinning forever", async () => {
  const never = new Promise(() => {});
  await assert.rejects(
    withOperationTimeout(never, 15, "Local model did not respond."),
    (error) => error instanceof OperationTimeoutError && error.message.includes("did not respond"),
  );
});

test("an underlying operation that rejects keeps its useful error", async () => {
  await assert.rejects(
    withOperationTimeout(Promise.reject(new Error("GPU device lost")), 100, "timed out"),
    /GPU device lost/,
  );
});

test("a late result cannot reverse the timeout outcome", async () => {
  let resolve;
  const underlying = new Promise((res) => { resolve = res; });
  const result = withOperationTimeout(underlying, 10, "deadline");
  await assert.rejects(result, /deadline/);
  resolve("late success");
});
