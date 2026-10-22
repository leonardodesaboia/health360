# P0-01 — Synthetic persistence and version boundaries

Dependencies: foundation; human selection of local DB environment.

All boxes intentionally unchecked. Assignment permits work only within the selected task's scope.

## 1. Inspect and plan

- [ ] 1.1 Confirm dependency completion and external-owner inputs; inspect affected areas: future `src/server/db`, Prisma schema/migrations, contracts, `.env.example`, architecture.
- [ ] 1.2 Refine design.md with concrete boundaries and map each scenario to a failing test before implementation.

## 2. Implement acceptance behavior with TDD

- [ ] 2.1 Synthetic seeds only.
- [ ] 2.2 Stable IDs/foreign keys.
- [ ] 2.3 Review/analysis/profile/context version links.
- [ ] 2.4 Previous versions cannot be silently overwritten.
- [ ] 2.5 No clinical data in logs.

## 3. Verify and review

- [ ] 3.1 Add and pass the required focused checks: isolated DB migration/seed integration, referential integrity, rollback, unique version constraints, no fixture mutation.
- [ ] 3.2 Run pnpm verify, pnpm test:e2e, pnpm format:check and strict OpenSpec validation; record actual results here.
- [ ] 3.3 Review spec conformance and applicable TypeScript/React, healthcare and security concerns; address findings.
- [ ] 3.4 Update canonical documentation and archive only after implementation and review are complete.

## Evidence

Not implemented. No verification result is claimed for these future scenarios.
