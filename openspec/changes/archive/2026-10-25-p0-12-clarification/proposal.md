## Why

[P0-12](../../../docs/backlog/IMPLEMENTATION.md#p0-12) is needed to complete Flow C: analysis identifies missing information but the patient cannot answer it.

## What Changes

- Select bounded English question templates from the latest analysis's deterministic missing fields (stored in AIAnalysis.missingInformation).
- Save complementary answers as an immutable profile version with explicit unknowns and patient-reported provenance, then invoke the exported analysis service.
- Reject unsupported fields, stale submissions and dataset/patient mismatches; preserve prior analyses and plans.
- Provide refresh/retry recovery and desktop/mobile Flow C coverage.

## Capabilities

### New Capabilities

- `patient-clarification`: Bounded questions and versioned answers before reanalysis.

## Impact

New clarification feature/server service and patient route composition. Depends on P0-07; physician-origin requests are deferred until a typed supported-field request reader exists. Owner-authored dependency commit `394b481` is carried unchanged with its original authorship, as explicitly confirmed by the orchestrator, to supply pending-analysis continuation. This worker does not edit those analysis internals. No chatbot, doctor route, clinical-review implementation, evidence change or autonomous publication.
