# P0-10 — Physician decisions and finalization

Status: planned; **no implementation completed**.

## Why

Persist approve/modify/reject/pending/clarify decisions with audit metadata.

## What Changes

modify/reject require reason; modifications retain revised text; reviewer/time/analysis version recorded; pending decisions prevent finalization; explicit finalization checks current versions and ownership atomically; synthetic reviewer is not represented as real clinical validation.

## Capabilities

### New Capabilities

- `physician-decisions`: Physician decisions and finalization.

### Modified Capabilities

None. This is a planned addition to the current foundation.

## Impact

review decision form/service, MedicalReview contract, workflow handlers.

## Dependencies

P0-09.

## Out of scope

Unrelated MVP modules, real-patient use, autonomous clinical decisions and product section 19 exclusions. This proposal does not authorize execution until assigned.
