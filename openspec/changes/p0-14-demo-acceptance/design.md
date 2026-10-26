## Scope

P0-14 part 1 covers the presenter walkthrough and browser acceptance of Flows A–E against main after P0-10, P0-12 and physician clarification merged. It does not claim the 18-point product acceptance audit or a timed release rehearsal, which remain open in this change. Application behavior is tested as implemented; no app code changes.

## Decisions

1. Acceptance specs and their fixture runner live in `tests/e2e/acceptance/`. Journeys use visible roles and labels. Each test owns a random demo cookie and dataset and removes only that dataset in fixture teardown.
2. Intake, analysis, clarification, physician decisions, finalization and reassessment all run through the real browser controls with the configured mock provider. The only fixture-prepared states are Flow E's injected provider faults (real analysis service, failing mock provider) and the Flow D-start fixture-reviewed plan; both are labeled as such.
3. Post-action status assertions use a 30-second timeout because server actions run claim, provider and completion transactions; this avoids false failures under parallel load without weakening assertions.
4. Flow B modifies the redundancy proposal so the patient plan shows only physician-revised wording and never the model title or rule ID. Flow D completes two full review cycles and checks both plan versions in history.
5. The presenter script matches these journeys step for step, keeps every disclaimer, and treats the mock provider as the fallback.

## Verification

Run `pnpm verify`, `PORT=3210 pnpm test:e2e` (desktop and mobile), `pnpm format:check` and strict OpenSpec validation against a disposable database with `LLM_PROVIDER=mock`. Record actual counts.

## Exclusions

No app changes, live model calls, real patient records, deployment or clinical validation claims.
