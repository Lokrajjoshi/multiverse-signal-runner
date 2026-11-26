import test from "node:test";
import assert from "node:assert/strict";
import { validateSignalResponse } from "../src/validate-signal.js";

test("accepts a valid signal response", () => {
  assert.deepEqual(
    validateSignalResponse({ signal: "online", score: 42, latency_ms: 120 }),
    { valid: true, errors: [] }
  );
});

test("reports invalid signal fields", () => {
  const result = validateSignalResponse({
    signal: "",
    score: 101,
    latency_ms: -1
  });

  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, [
    "signal must be a non-empty string",
    "score must be an integer from 0 through 100",
    "latency_ms must be a non-negative integer"
  ]);
});
