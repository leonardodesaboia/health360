## Why

[P0-14](../../../docs/backlog/IMPLEMENTATION.md#p0-14) needs an honest, reproducible HISIC demonstration for November 3, 2026. With P0-10 (#28), P0-12 (#26) and physician clarification (#30) merged, every A–E stage can be exercised end to end through real browser controls.

## What Changes

- Replace the presenter notes with a 5–7 minute judge walkthrough (`docs/product/DEMO_SCRIPT.md`): opening line, Alex and Jordan stories, exact clicks and routes, what to say, honesty disclaimers, pre-demo checklist and mock-provider fallback.
- Add Playwright acceptance journeys (`tests/e2e/acceptance/`) for Flows A–E with the mock provider, each owning an isolated synthetic dataset: A through approval and a published plan; B Jordan's possible redundancy, modified and published as reviewed wording; C unknown examination date answered with a date or with I don't know; D a second review cycle producing plan v2 while v1 is preserved; E six provider faults with safe retry.

## Capabilities

### New Capabilities

- `demo-acceptance`: reproducible, explicitly bounded demonstration and browser acceptance coverage.

### Modified Capabilities

None.

## Impact

Own `docs/product/DEMO_SCRIPT.md` and `tests/e2e/acceptance/`, plus this change and the P0-14 index entry. Reuse existing services and synthetic test fixtures; add no application routes, clinical rules, provider fallback, database schema changes or deployment. Patient UX files belong to another worker and are untouched. CI uses mock output; no live provider request is authorized by these tests.
