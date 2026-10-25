## Why

[P0-14](../../../docs/backlog/IMPLEMENTATION.md#p0-14) needs an honest, reproducible HISIC demonstration for November 3, 2026. This authorized first part covers the implemented journey without presenting pending physician decisions or clarification as delivered.

## What Changes

- Add an English presenter script with setup, synthetic cases, expected results, reset and recovery instructions.
- Add Playwright acceptance coverage for Flow A through the physician queue, Flow E failure and retry, and the start of Flow D with preservation of the previous reviewed plan.
- Track unavailable P0-10 and P0-12 stages with named `test.fixme` cases and TODOs. Keep the full P0-14 change open until all A–E stages are implemented and verified.

## Capabilities

### New Capabilities

- `demo-acceptance`: reproducible, explicitly bounded demonstration and browser acceptance coverage.

### Modified Capabilities

None.

## Impact

Own `docs/product/DEMO_SCRIPT.md` and `tests/e2e/acceptance/`, plus this change and the P0-14 index entry. Reuse existing producer services and synthetic test fixtures; add no application routes, clinical rules, provider fallback, database schema changes, or deployment. CI uses mock output; no live provider request is authorized by these tests.
