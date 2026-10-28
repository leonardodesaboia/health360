## Implementation

- [x] 1. Add failing regressions: presenter state reports availability and hides Jordan's exam date; prepared review screens show no empty missing-information warning.
- [x] 2. Return `{ session, preparedStatesAvailable }` from `/api/demo-session` and explain mock-only availability in the presenter panel.
- [x] 3. Remove the examination date from Jordan's case summary; render no `InformationGap` for an empty list.
- [x] 4. Update `DEMO_SCRIPT.md` (mock-only shortcuts, locale-dependent date entry).
- [x] 5. Full verification, self-review and archive.

## Evidence

- TDD: the five route tests failed against main because the response was a bare session or null, and the Jordan summary contained the date. The prepared review e2e failed on main because the empty "Missing information does not mean a condition is absent." notice was present.
- After the fix: `pnpm verify` PASS (456 unit tests, 1 opt-in live test skipped, production build). `pnpm test:e2e` PASS (136 desktop/mobile tests, mock provider, disposable PostgreSQL). `pnpm format:check` PASS. Strict OpenSpec PASS (23 items).
- Manual: a production build started with `LLM_PROVIDER=openai` and a placeholder key (no model calls) returns `{"session":null,"preparedStatesAvailable":false}`. At 1440 and 390 px the panel shows the mock-only note, no prepared buttons, no horizontal overflow and no console errors.
- Self-review: the server-side mock-only rejection is unchanged. The presenter state still exposes no dataset, profile or clinical fields. Unknown values stay unknown: hiding an empty list removes no missing item. No clinical rule, analysis or publication gate changed. This is not medical validation.
