## Implementation

- [x] 1. Define contract and write failing boundary tests.
- [x] 2. Implement server-only schemas, minimized prompt, provider interface, OpenAI adapter and deterministic mock.
- [x] 3. Implement bounded fail-closed result validation and guarded live smoke.
- [x] 4. Update configuration, architecture and P0-06 backlog entry.

## Verification and review

- [ ] 5. Run focused tests and full verify, e2e, formatting and strict OpenSpec validation; record real results.
- [x] 6. Review spec conformance, clinical safety, TypeScript and security boundaries inline.

## Close-out

After all implementation and verification tasks pass, archive this change and record archive/verification/PR links in P0-06. This administrative step is outside the implementation checkbox count to avoid an archive prerequisite depending on itself.

## Review evidence

Inline spec-conformance, clinical-safety, TypeScript and security review completed: all acceptance scenarios map to adapter tests; no UI, workflow, database or publication path added. No separate reviewer was claimed. Default mock missing-information loss was reproduced and fixed. Real source verification remains the context author's responsibility; test evidence is explicitly synthetic test-only content. P0-07 freshness/idempotency/persistence and real API access remain unverified here. Native AO review will follow PR publication.
