export function validateSignalResponse(value) {
  const errors = [];

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { valid: false, errors: ["response must be an object"] };
  }

  if (typeof value.signal !== "string" || value.signal.trim() === "") {
    errors.push("signal must be a non-empty string");
  }

  if (!Number.isInteger(value.score) || value.score < 0 || value.score > 100) {
    errors.push("score must be an integer from 0 through 100");
  }

  if (!Number.isInteger(value.latency_ms) || value.latency_ms < 0) {
    errors.push("latency_ms must be a non-negative integer");
  }

  return { valid: errors.length === 0, errors };
}
