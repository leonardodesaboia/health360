## Why

Flow D stops after requesting reassessment because intake only starts from NOT_STARTED. Patient Home also displays an unrelated fixture without a selected session.

## What Changes

- Resume patient intake from REASSESSMENT_PENDING and prefill from the latest dataset-scoped profile/intake.
- Save a new immutable profile and use the existing analysis route, preserving the reviewed prior plan.
- Show the case-selection entry state on Patient Home without a session.

## Capabilities

### New Capabilities

- `reassessment-intake`: Resume intake and analyze a second cycle.

## Impact

Follow-up to [P0-13](../../../docs/backlog/IMPLEMENTATION.md#p0-13). No analysis internals, doctor routes, review services, contracts or migrations change.
