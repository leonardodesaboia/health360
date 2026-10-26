## Why

The case-selection gap in [STATUS](../../../../docs/STATUS.md#known-gaps-and-risks), within [P0-02](../../../../docs/backlog/IMPLEMENTATION.md#p0-02), forces presenters to manually re-enter synthetic facts before analysis. Typed intake and analysis contracts already exist.

## What Changes

- Seed explicit typed patient-reported intake answers for Alex and Jordan.
- Preserve unknown facts and intentional clarification/out-of-scope variants.
- Prove stored case analysis paths using the existing mock provider.

## Capabilities

### New Capabilities

- `demo-seed-intake-facts`: complete synthetic case snapshots for analysis.

### Modified Capabilities

None.

## Impact

Only demo/scenario fixtures, their unit and DB tests, and the matching STATUS gap line change. No intake UI, AI implementation, physician UI, acceptance tests or demo script changes. All scenarios remain synthetic and demonstrative; review gates remain mandatory.
