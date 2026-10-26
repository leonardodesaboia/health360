## Build and regression coverage

- [x] Add failing DB tests for all four prepared states and their real screen-reader models.
- [x] Implement explicit scenario answers and producer-built prepared states with safe session activation/reset.
- [x] Add prepared selector options and existing-screen navigation without patient/physician UI edits.
- [x] Cover failure/retry, mock-only guard, isolated reset, producer failure and baseline compatibility.
- [x] Verify actual desktop/mobile screens and keyboard operation through selector tests outside acceptance.

## Verification and completion

- [x] Run focused units and full DB integration tests.
- [x] Run pnpm verify, pnpm test:e2e, pnpm format:check and strict OpenSpec validation.
- [x] Review scope, TypeScript, design and clinical/workflow boundaries inline; record verification evidence.

After verification and review, archive through the locked OpenSpec CLI. Publication follows archive: publish the scoped PR, request native AO review and obtain green CI; leave merging to the user.

## Verification evidence

Recorded October 26, 2026 on the branch rebased onto `origin/main` (4445499), with Postgres 17 in a disposable container:

- `pnpm verify`: PASS, 454 units passed and 1 existing live-provider smoke skipped; lint, strict typecheck and production build passed.
- `pnpm test:integration`: 100/100 PASS.
- `pnpm test:e2e --workers=1`: 134/134 PASS, desktop and mobile (11.8m). The first full run found 4 strict-locator collisions in the demo selector and plan pages, caused by hidden duplicate disclosure copy. The panel body now mounts only while open or while a prepared state is active.
- `pnpm format:check`: PASS. Strict OpenSpec validation: 23/23 PASS.
- Inline review: scope stays within the seed/selector lane, with no acceptance, patient-page or physician-UI edits. Every state is built by real producers. The failure state uses a demo-scoped failing mock, and retry goes through the normal analysis path. DEMONSTRATIVE labels are kept. This is engineering review only, not medical validation.
