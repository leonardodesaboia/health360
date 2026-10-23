## Implementation

- [x] 1. Define minimal configuration, conditional validation and draft repository contract; prove schema and persistence failure paths with red/green tests.
- [x] 2. Implement accessible English basic/history intake, navigation, save/restore and recovery with focused desktop/mobile tests.
- [x] 3. Run full verification, responsive/keyboard inspection and inline clinical/design/spec review; record actual evidence.
      Release bookkeeping: archive the completed change, update only P0-03, open a PR to main, request AO review and report the URL.

## Verification evidence

- TDD red: focused test failed because `./contracts` did not exist. Green: 5 focused tests passed.
- `pnpm verify`: PASS, 6 skill tests and 130 Vitest tests; ESLint, strict typecheck and production build passed.
- `PORT=3110 pnpm test:e2e`: PASS, 28 passed (43.7s), desktop and mobile; includes axe serious/critical checks, focus, conditional details, explicit unknown, back/next, refresh, corruption and failed save recovery. Initial alert selector ambiguity with the Next route announcer was fixed by scoping assertions to main.
- `pnpm format:check`: PASS. `openspec validate --all --strict --no-interactive`: 4 passed, 0 failed before archive.
- Inline self-review applied spec-conformance, clinical-safety, design-system, TypeScript/React and storage trust checklists. No independent reviewer yet; AO review follows PR creation. No clinical guidance or status transitions added.
- AO browser inspected the active intake and dispatched validation/keyboard interaction; no page errors. Desktop/mobile geometry, focus and accessible states verified by Playwright. No manual visual screenshot audit or full WCAG audit performed.
- Limitation: browser-local synthetic adapter only; Prisma/session integration awaits Worker A. Existing surrounding Portuguese UI belongs to the parallel English worker; all new intake copy is English.
