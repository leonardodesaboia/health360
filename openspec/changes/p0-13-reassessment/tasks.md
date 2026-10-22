# P0-13 — Longitudinal history and reassessment

Dependencies: P0-11, P0-12.

All boxes intentionally unchecked. Assignment permits work only within the selected task's scope.

## 1. Inspect and plan

- [ ] 1.1 Confirm dependency completion and external-owner inputs; inspect affected areas: health-timeline feature, profile versioning, plan history UI/service.
- [ ] 1.2 Refine design.md with concrete boundaries and map each scenario to a failing test before implementation.

## 2. Implement acceptance behavior with TDD

- [ ] 2.1 Profile/intake/analysis/review/publication events with provenance/version.
- [ ] 2.2 New data enters REASSESSMENT_PENDING.
- [ ] 2.3 Reanalysis and review create a new plan.
- [ ] 2.4 Old plan remains identified as previous and readable.
- [ ] 2.5 No predictive twin.

## 3. Verify and review

- [ ] 3.1 Add and pass the required focused checks: immutable prior versions, chronological ordering, cycle/version links, unfinished reassessment, duplicated event handling; flow D.
- [ ] 3.2 Run pnpm verify, pnpm test:e2e, pnpm format:check and strict OpenSpec validation; record actual results here.
- [ ] 3.3 Review spec conformance and applicable TypeScript/React, healthcare and security concerns; address findings.
- [ ] 3.4 Update canonical documentation and archive only after implementation and review are complete.

## Evidence

Not implemented. No verification result is claimed for these future scenarios.
