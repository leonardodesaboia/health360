# P0-03 — Guided intake, first slice

Status: planned; **no implementation completed**.

## Why

Implement basic profile and clinical-history steps before extending questions.

## What Changes

configuration-driven steps, back/forward, progress, explicit unknown answers, inline validation, draft save/restore on refresh; no overcollection.

## Capabilities

### New Capabilities

- `intake-draft`: Guided intake, first slice.

### Modified Capabilities

None. This is a planned addition to the current foundation.

## Impact

`features/health-intake`, `/patient/intake`, shared form/step controls, contracts.

## Dependencies

P0-01, P0-02; approved minimal scenario fields.

## Out of scope

Unrelated MVP modules, real-patient use, autonomous clinical decisions and product section 19 exclusions. This proposal does not authorize execution until assigned.
