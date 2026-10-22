# P0-07 — Validation and analysis orchestration

Status: planned; **no implementation completed**.

## Why

Validate evidence/category/required-field integrity and persist preliminary analysis safely.

## What Changes

malformed/unsupported/unknown-evidence/insufficient results block analysis; only validated preliminary proposals enter review queue; idempotent retries; current versions checked; failures publish no plan.

## Capabilities

### New Capabilities

- `analysis-validation`: Validation and analysis orchestration.

### Modified Capabilities

None. This is a planned addition to the current foundation.

## Impact

future AI validators/services, analysis contracts, workflow service, status UI.

## Dependencies

P0-06.

## Out of scope

Unrelated MVP modules, real-patient use, autonomous clinical decisions and product section 19 exclusions. This proposal does not authorize execution until assigned.
