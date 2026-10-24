## Why

P0-11 in [the ordered index](../../../docs/backlog/IMPLEMENTATION.md#p0-11) requires a dataset-scoped patient plan derived solely from finalized physician decisions for the November 3 HISIC demonstration.

## What Changes

- Add guarded, idempotent plan publication after a current finalized review.
- Replace the static patient plan page with reviewed content or explicit unavailable states.
- Preserve review, profile, and previous-plan links and append a publication event atomically.

## Capabilities

### New Capabilities

- `reviewed-plan`: publication gates and patient-facing reviewed content.

### Modified Capabilities

None.

## Impact

Owns `src/server/preventive-plan`, `src/features/preventive-plan`, and `/patient/plan`. Uses existing shared contracts and dataset repository. No LLM calls, clinical criteria, reviewer writes, or deployment. Producer integration follows the shared Wave 2 interfaces.
