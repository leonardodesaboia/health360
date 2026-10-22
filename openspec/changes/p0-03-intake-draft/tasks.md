# P0-03 — Guided intake, first slice

Dependencies: P0-01, P0-02; approved minimal scenario fields.

All boxes intentionally unchecked. Assignment permits work only within the selected task's scope.

## 1. Inspect and plan

- [ ] 1.1 Confirm dependency completion and external-owner inputs; inspect affected areas: `features/health-intake`, `/patient/intake`, shared form/step controls, contracts.
- [ ] 1.2 Refine design.md with concrete boundaries and map each scenario to a failing test before implementation.

## 2. Implement acceptance behavior with TDD

- [ ] 2.1 Configuration-driven steps, back/forward, progress, explicit unknown answers, inline validation, draft save/restore on refresh.
- [ ] 2.2 No overcollection.

## 3. Verify and review

- [ ] 3.1 Add and pass the required focused checks: Zod conditional fields/unknown handling, draft integration, keyboard/mobile navigation, refresh and error recovery.
- [ ] 3.2 Run pnpm verify, pnpm test:e2e, pnpm format:check and strict OpenSpec validation; record actual results here.
- [ ] 3.3 Review spec conformance and applicable TypeScript/React, healthcare and security concerns; address findings.
- [ ] 3.4 Update canonical documentation and archive only after implementation and review are complete.

## Evidence

Not implemented. No verification result is claimed for these future scenarios.
