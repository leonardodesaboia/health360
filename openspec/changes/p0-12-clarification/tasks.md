# P0-12 — Deterministic clarification loop

Dependencies: P0-07, P0-10.

All boxes intentionally unchecked. Assignment permits work only within the selected task's scope.

## 1. Inspect and plan

- [ ] 1.1 Confirm dependency completion and external-owner inputs; inspect affected areas: clarification feature, intake/profile updates, workflow service.
- [ ] 1.2 Refine design.md with concrete boundaries and map each scenario to a failing test before implementation.

## 2. Implement acceptance behavior with TDD

- [ ] 2.1 Restricted question templates selected by required gaps.
- [ ] 2.2 Explicit “Não sei”.
- [ ] 2.3 Persisted answer creates a profile version and re-enters analysis.
- [ ] 2.4 Unresolved unknowns remain blocked where required.
- [ ] 2.5 Review-origin clarification invalidates stale proposals.

## 3. Verify and review

- [ ] 3.1 Add and pass the required focused checks: supported/unsupported fields, unknown answer, refresh recovery, new profile version, stale review rejection, no direct transition to plan; flow C.
- [ ] 3.2 Run pnpm verify, pnpm test:e2e, pnpm format:check and strict OpenSpec validation; record actual results here.
- [ ] 3.3 Review spec conformance and applicable TypeScript/React, healthcare and security concerns; address findings.
- [ ] 3.4 Update canonical documentation and archive only after implementation and review are complete.

## Evidence

Not implemented. No verification result is claimed for these future scenarios.
