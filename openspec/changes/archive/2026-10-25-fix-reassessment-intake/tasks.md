## Implementation

- [x] 1. Inspect existing services and add a real intake reassessment integration regression.
- [x] 2. Permit reassessment intake and scope latest-profile prefilling/browser drafts to the selected dataset.
- [x] 3. Remove the fixture fallback from Patient Home.
- [x] 4. Add and run second-cycle browser coverage through analysis.
- [x] 5. Run full verification, inspect UI and self-review.

## Evidence

- Initial regression execution required installing locked dependencies; no dependency versions changed.
- Regression sensitivity check: restoring the original NOT_STARTED-only guard failed with expected INTAKE_IN_PROGRESS, received REASSESSMENT_PENDING. The verified implementation was immediately restored.
- `pnpm verify`: PASS; six skill-script tests, ESLint, TypeScript, 378 unit tests passed, one opt-in live-provider test skipped, production build completed.
- `pnpm test:integration`: PASS; 8 files, 59 PostgreSQL tests. Real intake/profile completion calls the exported analysis service and reaches clarification with unknown facts. Prior profile and plan remain unchanged.
- `PORT=3250 LLM_PROVIDER=mock pnpm test:e2e`: PASS; 60 desktop/mobile tests, including actual reassessment form submission and analysis, persisted v2 profile/analysis and preserved v1 plan.
- `pnpm format:check`: PASS. Strict OpenSpec validation: 15 passed, 0 failed.
- Self-review applied spec, TypeScript/React, clinical, design and security checklists inline: canonical legal transitions, dataset/patient scope, unknown/provenance preservation, immutable versions, no proposal exposure, no doctor/analysis-internal changes, shared UI tokens.
- Browser coverage checks desktop/mobile overflow, keyboard navigation and serious/critical axe violations. AO Browser entry-page snapshot also confirmed the case-selection heading without a fixture greeting; Tab was exercised. No manual assistive-technology audit or clinical validation claimed.
- Full second physician review/publication remains outside this focused fix; the existing producer fixture tests that separate cycle. No real provider call performed.
- After rebasing onto main with P0-08: `pnpm verify` PASS (386 unit tests, one opt-in live test skipped, production build); PostgreSQL integration PASS (9 files, 61 tests); port 3250 e2e PASS (60 desktop/mobile); formatting PASS; strict specs PASS (16 items).
