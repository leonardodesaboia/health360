# Demonstration session and reset

## Why

[P0-02](../../../docs/backlog/IMPLEMENTATION.md#p0-02) lets a presenter pick one prepared synthetic case and see the same stored case in the patient and physician views, then reset it. It depends on P0-01 persistence (PR #8) and reuses the P0-05 synthetic scenario inputs.

## What Changes

- Add a cookie-bound demo session: an opaque random token maps to one per-browser dataset holding the selected case (`first-screening` or `repeat-screening`).
- Add server actions to select a case and reset the current dataset. Reset deletes and reseeds only that dataset.
- The case selector at `/`, patient home, physician queue and review workspace read the session case from storage. Without a session they show an empty state.
- Prototype labels remain. Role switching stays navigation only.

Excluded: intake and plan screens (P0-03/P0-04/P0-10 lanes), clinical analysis, review decisions, authentication and storage of P0-05 screening facts.

## Capabilities

### New Capabilities

- `demo-session`: per-browser synthetic case selection, shared case state and scoped reset.

### Modified Capabilities

- `demo-mode`: reference routes and the prepared case now come from the selected demo session instead of the fixed Marina fixture.

## Impact

`src/server/demo`, a nullable `Dataset.scenarioId` migration, the root, patient-home, doctor-queue and review routes, e2e/integration tests, architecture and the P0-02 index entry. Synthetic data only. No external APIs.

## Delivery phases

The orchestrator requested a server-only PR (a) first to unblock parallel consumers. It provides contracts, cookie session resolution, transactional select/reset, and coherent stored case reads. UI behavior above remains planned for PR (b). Intake and plan routes remain with their assigned workers; temporary fixture/session inconsistency there is accepted until they integrate getDemoSession. P0-02 stays in progress and this change is not archived until both phases are delivered.
