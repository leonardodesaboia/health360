# P0-05 — Restricted clinical context and deterministic checks

Dependencies: P0-04; owner-supplied criteria, evidence IDs and expected synthetic outcomes.

All boxes intentionally unchecked. Assignment permits work only within the selected task's scope.

## 1. Inspect and plan

- [ ] 1.1 Confirm dependency completion and external-owner inputs; inspect affected areas: future `src/server/clinical-rules`, context fixtures/contracts and scenario docs.
- [ ] 1.2 Refine design.md with concrete boundaries and map each scenario to a failing test before implementation.

## 2. Implement acceptance behavior with TDD

- [ ] 2.1 Deterministic eligibility, contraindication and blocking checks are separate from the LLM.
- [ ] 2.2 Evidence IDs/version/source and review status recorded.
- [ ] 2.3 Unknown data can block or clarify.
- [ ] 2.4 No broad clinical search/RAG.

## 3. Verify and review

- [ ] 3.1 Add and pass the required focused checks: medically specified positive/negative/unknown boundary cases, unsupported scenario rejection, missing context version, no autonomous scope expansion.
- [ ] 3.2 Run pnpm verify, pnpm test:e2e, pnpm format:check and strict OpenSpec validation; record actual results here.
- [ ] 3.3 Review spec conformance and applicable TypeScript/React, healthcare and security concerns; address findings.
- [ ] 3.4 Update canonical documentation and archive only after implementation and review are complete.

## Evidence

Not implemented. No verification result is claimed for these future scenarios.
