# P0-11 — Reviewed preventive plan

Status: planned; **no implementation completed**.

## Why

Publish a patient-facing version derived solely from finalized physician decisions.

## What Changes

approved/modified actions only; reviewed redundancy, pending information, next steps and action states understandable in pt-BR; all references trace to the review; direct URL/API cannot expose preliminary proposals as a plan.

## Capabilities

### New Capabilities

- `reviewed-plan`: Reviewed preventive plan.

### Modified Capabilities

None. This is a planned addition to the current foundation.

## Impact

preventive-plan feature, publication service, `/patient/plan`, contracts.

## Dependencies

P0-10.

## Out of scope

Unrelated MVP modules, real-patient use, autonomous clinical decisions and product section 19 exclusions. This proposal does not authorize execution until assigned.
