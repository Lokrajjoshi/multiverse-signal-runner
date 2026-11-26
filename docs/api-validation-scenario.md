# API validation scenario

This note defines a small, repeatable validation workflow for a future API-backed extension of Multiverse Signal Runner.

## Scenario

Validate a JSON response before it is used by the game or a reporting workflow.

## Checks

1. The response is valid JSON.
2. The HTTP status is in the expected success range.
3. Required fields are present.
4. Numeric fields stay within an agreed range.
5. Unknown fields are ignored rather than breaking the consumer.
6. A malformed or incomplete response produces a clear, actionable failure.

## Example contract

```json
{
  "signal": "online",
  "score": 42,
  "latency_ms": 120
}
```

Required fields:

- `signal`: non-empty string
- `score`: integer from 0 through 100
- `latency_ms`: non-negative integer

## Evidence to record

For each validation run, record:

- endpoint or fixture name
- timestamp
- status code
- validation result
- failed rule, when applicable
- test or fixture version

This keeps the workflow useful for API testing, technical troubleshooting, and evidence-first reporting without coupling the example to the existing game logic.
