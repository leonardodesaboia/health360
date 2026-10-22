# P0-10 — Physician decisions and finalization

Dependencies: P0-09.

All boxes intentionally unchecked. Assignment permits work only within the selected task's scope.

## 1. Inspect and plan

- [ ] 1.1 Confirm dependency completion and external-owner inputs; inspect affected areas: review decision form/service, MedicalReview contract, workflow handlers.
- [ ] 1.2 Refine design.md with concrete boundaries and map each scenario to a failing test before implementation.

## 2. Implement acceptance behavior with TDD

- [ ] 2.1 Modify/reject require reason.
- [ ] 2.2 Modifications retain revised text.
- [ ] 2.3 Reviewer/time/analysis version recorded.
- [ ] 2.4 Pending decisions prevent finalization.
- [ ] 2.5 Explicit finalization checks current versions and ownership atomically.
- [ ] 2.6 Synthetic reviewer is not represented as real clinical validation.

## 3. Verify and review

- [ ] 3.1 Add and pass the required focused checks: reason validation, pending/clarification block, stale versions, unauthorized mutation, duplicate finalization, concurrent review; A/B review stages.
- [ ] 3.2 Run pnpm verify, pnpm test:e2e, pnpm format:check and strict OpenSpec validation; record actual results here.
- [ ] 3.3 Review spec conformance and applicable TypeScript/React, healthcare and security concerns; address findings.
- [ ] 3.4 Update canonical documentation and archive only after implementation and review are complete.

## Evidence

Not implemented. No verification result is claimed for these future scenarios.
