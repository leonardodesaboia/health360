## Why

P0-13 in [the ordered index](../../../docs/backlog/IMPLEMENTATION.md#p0-13) requires a patient history and preserved plan versions while a new evaluation is prepared for the HISIC demonstration.

## What Changes

- Add a dataset-scoped patient timeline showing real linked versioned events and provenance.
- Link preserved, reviewed plan versions to read-only historical views.
- Start reassessment through the canonical legal transition and reuse the intake and analysis producers for the updated profile cycle.

## Capabilities

### New Capabilities

- `patient-history`: linked longitudinal events, previous reviewed plans and reassessment entry.

### Modified Capabilities

None.

## Impact

Owns `src/features/health-timeline`, `src/server/health-timeline`, `/patient/history` and patient history navigation. Depends on the P0-11 reviewed-plan reader and shared demo/workflow contracts. No predictive model, plan diff, new clinical questions, analysis/review writes, or clinical validation claim.
