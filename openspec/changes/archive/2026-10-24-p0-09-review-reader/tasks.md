## 1. Contract and reader

- [x] 1.1 Add contract-based regression fixtures and reproduce reader failures.
- [x] 1.2 Implement pure version joins, scoped queue and stale detection.
- [x] 1.3 Add demo-session-scoped server reads without fixture fallback.

## 2. Screens

- [x] 2.1 Replace queue and workspace using existing components and accessible disclosures.
- [x] 2.2 Cover no-session, invalid ID, responsive and keyboard states.

## 3. Delivery

- [x] 3.1 Run verify, e2e on port 3220, format check and strict OpenSpec validation; record exact evidence.
- [x] 3.2 Apply clinical/design/spec review and verify archive readiness.

## Verification (2026-10-24)

- TDD: missing reader import initially failed; transaction-before-reads and blocked-proposal regressions also reproduced failures before implementation.
- Rebased onto origin/main 729e746; real workflow and demo-session APIs replace upstream assumptions. No production stubs or fixture fallback remain.
- Focused reader/service regressions: 12 passed. PostgreSQL-backed focused browser scenarios: 8 passed (58.0s).
- pnpm verify: PASS (13 skill files checked; 6 skill tests; ESLint; strict TypeScript; 299 Vitest tests passed, one opt-in live-provider test skipped; production build passed).
- PORT=3220 pnpm test:e2e: PASS, 48 desktop/mobile tests (2.0m), including real stored time, keyboard disclosures, foreign datasets, stale profiles and blocked proposals.
- pnpm format:check: PASS, all matched files use Prettier code style.
- pnpm exec openspec validate --all --strict --no-interactive: PASS, 13 items, zero failures.
- Visual checks: inspected desktop and mobile workspace screenshots; two columns collapse to a readable stack, evidence focus ring is visible, no horizontal overflow. AO Browser inspection confirmed the no-session queue prompt. Automated keyboard checks ran; the serious/critical axe scans covered foundation routes and the empty queue, not the populated queue/workspace. Populated axe coverage is added in the P0-10 review follow-up. No full manual screen-reader or WCAG audit is claimed.
- Test fixtures reference the clinicalContext already seeded by replaceDemoDataset and use isolated datasets in a session-owned PostgreSQL database. DB fixture setup/cleanup has a separate 60-second budget; browser bodies/assertions retain their defaults.
- Inline spec/design/clinical review: exact dataset/patient/version joins fail closed; blocked proposal content is suppressed; unknown facts retain provenance; rule/source metadata is version-matched; no production writes, clinical criteria or patient guidance are introduced.
- Unknown IDs assert the Next.js streamed not-found boundary (200 or 404, noindex, no patient context). An identical duplicate framework metadata tag is tolerated by selecting the first noindex assertion target.
- P0-07/P0-08 producer behavior remains outside this task; browser fixtures are explicitly synthetic and perform no live AI analysis. Demonstration content is not clinically validated.

## Producer integration refresh (2026-10-25)

- Rebased PR #21 onto origin/main e855869, including merged P0-07 analysis (#20) and deployment readiness (#22). Architecture conflicts retain both the history/reassessment and physician-reader sections.
- The positive browser fixture now calls the real analyzeSession service, deterministic evaluator, AI validation and persistence pipeline using MockProvider only. It creates a completed synthetic intake/profile v2, references the existing seeded context, and asserts a persisted PRELIMINARY analysis with proposals before opening the reader. No live model call is made.
- Reader assertions are scoped to main content so the shared case selector's duplicate patient labels cannot match queue records. The case-selector warning assertion accepts the repeated required demonstrative notice.
- Focused reader plus case-selector e2e: 14 passed (1.4m), desktop and mobile.
- pnpm test:integration: PASS, 58 tests across 8 files, including real P0-07 persistence and dataset isolation.
- pnpm verify: PASS, 390 unit tests passed, one opt-in live-provider test skipped; skill checks/tests, ESLint, strict TypeScript and production build passed.
- PORT=3220 pnpm test:e2e: PASS, all 64 desktop/mobile tests (3.1m).
- pnpm format:check: PASS, all matched files use Prettier code style.
- Strict OpenSpec validation: PASS, 15 items, zero failures.
- Inspected refreshed desktop/mobile screenshots with real producer records: exact profile/context/analysis versions, source issuer/year, preliminary labels and keyboard evidence focus remain visible without page overflow. The shared selector's cramped mobile description was reported to its owner; selector styling is outside this task.
