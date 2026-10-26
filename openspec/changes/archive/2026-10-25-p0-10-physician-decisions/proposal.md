## Why

[P0-10](../../../docs/backlog/IMPLEMENTATION.md#p0-10) requires auditable physician decisions and explicit, atomic review finalization for the synthetic demonstration.

## What Changes

- Record all five shared decision values in immutable MedicalReview versions.
- Validate reasons and revised text; bind each decision to the current analysis and demo reviewer.
- Recheck dataset ownership, exact proposal set, profile/context/analysis freshness and evidence before saving or finalizing.
- Finalize atomically with timeline and legal workflow transition. Pending and clarification decisions block completion; clarification routes back through analysis.

## Capabilities

### New Capabilities

- `physician-decisions`: server-validated draft decisions and finalization.

### Modified Capabilities

- `physician-reader`: resolve PR #21 native-review findings for blocked provenance and populated queue/workspace accessibility.

## Impact

Clinical-review feature and server service/actions; existing shared MedicalReview and TimelineEvent contracts. Writes only review/event records plus the shared workflow transition API. No plan publication.
