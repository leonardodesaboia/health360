# P1-01 — AI-assisted question phrasing

Dependencies: P0-12, P0-06.

All boxes intentionally unchecked. Assignment permits work only within the selected task's scope.

## 1. Inspect and plan

- [ ] 1.1 Confirm dependency completion and external-owner inputs; inspect affected areas: clarification prompt/service and question UI.
- [ ] 1.2 Refine design.md with concrete boundaries and map each scenario to a failing test before implementation.

## 2. Implement acceptance behavior with TDD

- [ ] 2.1 Model cannot choose new clinical fields or scope.
- [ ] 2.2 Template fallback on failure.
- [ ] 2.3 Explicit unknown remains possible.

## 3. Verify and review

- [ ] 3.1 Add and pass the required focused checks: prompt injection, out-of-scope phrasing, malformed output, timeout fallback, preserved field identity.
- [ ] 3.2 Run pnpm verify, pnpm test:e2e, pnpm format:check and strict OpenSpec validation; record actual results here.
- [ ] 3.3 Review spec conformance and applicable TypeScript/React, healthcare and security concerns; address findings.
- [ ] 3.4 Update canonical documentation and archive only after implementation and review are complete.

## Evidence

Not implemented. No verification result is claimed for these future scenarios.
