# P0-11 — Reviewed preventive plan

Dependencies: P0-10.

All boxes intentionally unchecked. Assignment permits work only within the selected task's scope.

## 1. Inspect and plan

- [ ] 1.1 Confirm dependency completion and external-owner inputs; inspect affected areas: preventive-plan feature, publication service, `/patient/plan`, contracts.
- [ ] 1.2 Refine design.md with concrete boundaries and map each scenario to a failing test before implementation.

## 2. Implement acceptance behavior with TDD

- [ ] 2.1 Approved/modified actions only.
- [ ] 2.2 Reviewed redundancy, pending information, next steps and action states understandable in pt-BR.
- [ ] 2.3 All references trace to the review.
- [ ] 2.4 Direct URL/API cannot expose preliminary proposals as a plan.

## 3. Verify and review

- [ ] 3.1 Add and pass the required focused checks: reject/pending exclusion, ownership, review bypass rejection, stale cycle rejection, repeat publication idempotency, output matches decisions; complete flows A/B.
- [ ] 3.2 Run pnpm verify, pnpm test:e2e, pnpm format:check and strict OpenSpec validation; record actual results here.
- [ ] 3.3 Review spec conformance and applicable TypeScript/React, healthcare and security concerns; address findings.
- [ ] 3.4 Update canonical documentation and archive only after implementation and review are complete.

## Evidence

Not implemented. No verification result is claimed for these future scenarios.
