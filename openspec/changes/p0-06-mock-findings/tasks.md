## Implementation

- [x] 1. Reproduce missing mock findings with P0-07's minimized rationale payload and add failure regressions.
- [x] 2. Generate only supported allowed findings; preserve empty scope, unknowns and explicit test overrides.
- [x] 3. Update adapter documentation and only the P0-06 backlog entry.

## Verification and review

- [ ] 4. Run focused tests, pnpm verify, e2e on a separate port, formatting and strict OpenSpec validation; record real results.
- [x] 5. Review clinical safety, TypeScript, security and spec conformance inline.

Archive and link the follow-up PR after all implementation checks pass.

## Review evidence

Inline clinical-safety, TypeScript, security and spec-conformance review: only allowed findings and SYSTEM_STRUCTURED matched records are emitted; exact rule/category/evidence IDs are copied; missing, ambiguous, stale and oversized support blocks without partial data. Unknown information, demonstrative labels and mandatory physician review remain intact. Explicit failure injection remains unchanged. No separate reviewer was claimed; native AO review follows the follow-up PR.

TDD evidence: the new regression initially produced 9 failing tests (empty proposals and unsupported support accepted). After implementation, all 39 focused adapter tests passed with 1 intentional live smoke skip. Two additional bounds/duplicate regressions are included in full verification.
