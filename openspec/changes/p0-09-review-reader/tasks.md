## 1. Contract and reader

- [x] 1.1 Add contract-based regression fixtures and reproduce reader failures.
- [x] 1.2 Implement pure version joins, scoped queue and stale detection.
- [ ] 1.3 Add demo-session-scoped server reads without fixture fallback.

## 2. Screens

- [ ] 2.1 Replace queue and workspace using existing components and accessible disclosures.
- [ ] 2.2 Cover no-session, invalid ID, responsive and keyboard states.

## 3. Delivery

- [ ] 3.1 Run verify, e2e on port 3220, format check and strict OpenSpec validation; record exact evidence.
- [ ] 3.2 Review clinical/design/spec boundaries, archive and open PR to main.

## Verification in progress

- Red: Vitest failed with missing ./reader import before implementation.
- Focused regressions: 8 tests passed in reader.test.ts and server reader.test.ts (2026-10-23).
- Strict OpenSpec validation: 6 items passed, 0 failed.
- Full verify: skill checks (13 files), skill tests (6) and ESLint passed; Prisma generation passed after sandbox cache retry. TypeScript stopped at TS2307: ../demo/session is not yet available from P0-02.
- E2E and manual browser inspection remain unverified until the upstream module is integrated; no completed-delivery claim.
