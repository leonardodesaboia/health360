## Scope

Part 1 of P0-14 is explicitly authorized while P0-10 remains unfinished. P0-12 clarification merged during part 1 (#26), so its acceptance journey is included. It must not claim all 18 product acceptance points or full A–E completion. Preserve the application and test existing behavior rather than patch unrelated flow gaps.

## Implementation plan

1. Inspect the actual intake, analysis, queue and history interfaces and their existing tests. Build the presenter script from those implemented controls.
2. Put acceptance specs and their small fixture runner in `tests/e2e/acceptance/`. Use visible roles/labels in browser journeys. Each test owns a random cookie/dataset and cleans up only that dataset in a finally/fixture teardown.
3. Flow A selects Alex Example, completes and confirms real intake, reloads persisted status, runs mock analysis, verifies the patient plan gate and opens the physician queue. Stop before decision/finalization.
4. Flow E uses the real analysis service with a deliberately failing mock provider to prepare an auditable failure. The browser verifies safe feedback and absent plan, retries through the actual action against the configured mock provider, and verifies one preliminary success plus preserved failure history. Fixture setup is reported as such, never a real API outage.
5. Flow D reuses the synthetic reviewed-cycle fixture for plan v1, starts reassessment through the browser, checks the intake destination/history event, and verifies the old reviewed plan remains preserved. This does not exercise physician review UI or produce plan v2.
6. Named `test.fixme` entries with explicit dependency TODOs represent deferred decision/finalization, clarification, and complete second-cycle coverage. Do not mark them passing or archive the full P0-14 change.

## Verification

Run the new acceptance specs against the production build on PORT=3210 with mock provider and a disposable local database; run the complete required verify/e2e/format/OpenSpec sequence. The existing Playwright desktop and mobile projects run the acceptance specs automatically. Record actual passed/fixme counts and limitations. Review clinical labels, absence of unreviewed patient guidance, fixture isolation, English copy and secret handling.

## Exclusions

No app changes, live model calls, real patient records, deployment, clinical validation, merged PRs, or completion claims for deferred P0-10 behavior.
