## Why

[P0-07](../../../docs/backlog/IMPLEMENTATION.md#p0-07) needs a server-owned bridge from the latest dataset-scoped intake profile through deterministic rules and the P0-06 adapter to immutable preliminary analyses. The HISIC demonstration must fail closed and never imply physician approval.

## What Changes

- Map typed intake facts using tri-state OR, preserving unknown values.
- Minimize provider input and validate each output against the exact deterministic findings and supplied evidence.
- Persist an analysis and its proposals atomically with legal workflow transitions and timeline events. Failed attempts contain no proposals; retries preserve history and successful retries are idempotent.
- Expose an analyze server action bound to the active demo session, for intake completion and reassessment.

## Capabilities

### New Capabilities

- `analysis-orchestration`: dataset-scoped, versioned, fail-closed preliminary analysis.

### Modified Capabilities

None.

## Impact

Own `src/server/analysis`. Consume P0-02 demo sessions, P0-04 typed profiles, P0-05 rules and P0-06 adapter. Coordinate minimal additive shared contract/persistence changes where needed. Physician decisions, plan publication and UI owned by other workers remain out of scope. Update architecture, user flows and the ordered index. Verify adversarial output, stale versions, retry/concurrency, minimization, and legal workflow transitions; run the full repository checks before PR.
