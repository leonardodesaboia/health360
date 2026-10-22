# P0-04 — Intake completion and clinical profile

Dependencies: P0-03.

All boxes intentionally unchecked. Assignment permits work only within the selected task's scope.

## 1. Inspect and plan

- [ ] 1.1 Confirm dependency completion and external-owner inputs; inspect affected areas: intake/profile features, examination contracts, patient reference routes.
- [ ] 1.2 Refine design.md with concrete boundaries and map each scenario to a failing test before implementation.

## 2. Implement acceptance behavior with TDD

- [ ] 2.1 User can review/edit answers.
- [ ] 2.2 Confirmed submission creates a profile version and completes intake atomically.
- [ ] 2.3 Declared/structured/unknown provenance remains distinct.
- [ ] 2.4 Duplicate submission does not create duplicate cycles.

## 3. Verify and review

- [ ] 3.1 Add and pass the required focused checks: conditional questions, unknown examination date/result, concurrent edits, repeat submit, persisted profile matches answers, flow A pre-analysis slice.
- [ ] 3.2 Run pnpm verify, pnpm test:e2e, pnpm format:check and strict OpenSpec validation; record actual results here.
- [ ] 3.3 Review spec conformance and applicable TypeScript/React, healthcare and security concerns; address findings.
- [ ] 3.4 Update canonical documentation and archive only after implementation and review are complete.

## Evidence

Not implemented. No verification result is claimed for these future scenarios.
