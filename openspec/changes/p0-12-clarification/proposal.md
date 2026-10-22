# P0-12 — Deterministic clarification loop

Status: planned; **no implementation completed**.

## Why

Collect application-selected missing fields without a chatbot.

## What Changes

restricted question templates selected by required gaps; explicit “Não sei”; persisted answer creates a profile version and re-enters analysis; unresolved unknowns remain blocked where required; review-origin clarification invalidates stale proposals.

## Capabilities

### New Capabilities

- `clarification`: Deterministic clarification loop.

### Modified Capabilities

None. This is a planned addition to the current foundation.

## Impact

clarification feature, intake/profile updates, workflow service.

## Dependencies

P0-07, P0-10.

## Out of scope

Unrelated MVP modules, real-patient use, autonomous clinical decisions and product section 19 exclusions. This proposal does not authorize execution until assigned.
