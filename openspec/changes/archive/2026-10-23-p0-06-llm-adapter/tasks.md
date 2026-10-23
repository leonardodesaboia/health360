## Implementation

- [x] 1. Define contract and write failing boundary tests.
- [x] 2. Implement server-only schemas, minimized prompt, provider interface, OpenAI adapter and deterministic mock.
- [x] 3. Implement bounded fail-closed result validation and guarded live smoke.
- [x] 4. Update configuration, architecture and P0-06 backlog entry.

## Verification and review

- [x] 5. Run focused tests and full verify, e2e, formatting and strict OpenSpec validation; record real results.
- [x] 6. Review spec conformance, clinical safety, TypeScript and security boundaries inline.

## Close-out

After all implementation and verification tasks pass, archive this change and record archive/verification/PR links in P0-06. This administrative step is outside the implementation checkbox count to avoid an archive prerequisite depending on itself.

## Review evidence

Inline spec-conformance, clinical-safety, TypeScript and security review completed: all acceptance scenarios map to adapter tests; no UI, workflow, database or publication path added. No separate reviewer was claimed. Default mock missing-information loss was reproduced and fixed. Real source verification remains the context author's responsibility; test evidence is explicitly synthetic test-only content. P0-07 freshness/idempotency/persistence and real API access remain unverified here. Native AO review will follow PR publication.

## Verification evidence (after rebase on main f464c4d, 2026-10-23)

- `pnpm verify`: PASS. Lint 0 warnings, typecheck clean, Vitest 7 files passed, 1 skipped; 197 tests passed, 1 skipped (the guarded live smoke, skipped without LLM_LIVE_SMOKE=1). Production build compiled.
- `PORT=3196 pnpm test:e2e`: PASS. 22 passed (desktop + mobile).
- `pnpm format:check`: PASS.
- `pnpm exec openspec validate --all --strict --no-interactive`: PASS (6 items).
- Not verified: the real OpenAI API call (no authorized key or live run). The P0-05 evaluator output to adapter context mapping is deferred to P0-07.
