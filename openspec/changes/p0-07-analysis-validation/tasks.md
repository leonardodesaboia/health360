# P0-07 — Validation and analysis orchestration

Dependencies: P0-06.

All boxes intentionally unchecked. Assignment permits work only within the selected task's scope.

## 1. Inspect and plan

- [ ] 1.1 Confirm dependency completion and external-owner inputs; inspect affected areas: future AI validators/services, analysis contracts, workflow service, status UI.
- [ ] 1.2 Refine design.md with concrete boundaries and map each scenario to a failing test before implementation.

## 2. Implement acceptance behavior with TDD

- [ ] 2.1 Malformed/unsupported/unknown-evidence/insufficient results block analysis.
- [ ] 2.2 Only validated preliminary proposals enter review queue.
- [ ] 2.3 Idempotent retries.
- [ ] 2.4 Current versions checked.
- [ ] 2.5 Failures publish no plan.

## 3. Verify and review

- [ ] 3.1 Add and pass the required focused checks: adversarial structured output, fabricated reference, stale profile, duplicate request, timeout/retry, safe error copy; flow E.
- [ ] 3.2 Run pnpm verify, pnpm test:e2e, pnpm format:check and strict OpenSpec validation; record actual results here.
- [ ] 3.3 Review spec conformance and applicable TypeScript/React, healthcare and security concerns; address findings.
- [ ] 3.4 Update canonical documentation and archive only after implementation and review are complete.

## Evidence

Not implemented. No verification result is claimed for these future scenarios.
