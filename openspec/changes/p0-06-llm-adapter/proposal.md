## Why

Implement [P0-06](../../../docs/backlog/IMPLEMENTATION.md#p0-06) for the HISIC synthetic demo. The LLM must be replaceable and must never authorize clinical decisions.

## What Changes

- Add a server-only provider interface, official OpenAI SDK adapter, deterministic mock, versioned prompt and strict Zod response contract.
- Minimize synthetic input, validate supplied evidence and deterministic scope, bound requests and map failures to blocked results.
- Document configuration and an explicitly enabled, non-CI live smoke check.

## Capabilities

### New Capabilities

- `llm-adapter`: preliminary structured analysis through a replaceable provider.

### Modified Capabilities

None.

## Impact

P0-05 is satisfied through a versioned context interface rather than merged clinical-rules code under the authorized parallel wave. Existing HealthProfile and proposal category contracts remain unchanged. No DB, UI, publication, workflow transition, retries or P0-07 persistence/orchestration. Tests cover minimization, configuration, refusal, timeout, API errors, malformed/partial output and unknown evidence. Update ARCHITECTURE.md, .env.example and only P0-06 in the ordered index.
