## Implementation

- [x] Add unit and DB regression tests and observe meaningful failures.
- [x] Seed complete typed facts and preserve intentional scenario variants.
- [x] Update only the matching STATUS gap line.

## Verification and review

- [x] Run focused unit and DB tests.
- [x] Run pnpm verify, test:e2e, format:check and strict OpenSpec validation.
- [x] Review spec conformance, TypeScript and clinical safety inline; record results and archive.

## Evidence

- Red: new unit tests failed 4/9 because intakeFacts was undefined; new DB regressions failed 4/16 on missing typed facts, wrong clarification fields and symptomatic case clarifying instead of blocking.
- Green: focused unit regressions 57 passed; demo DB integration 16 passed; full DB integration suite 90 passed.
- pnpm verify: passed skills checks, lint, strict typecheck, 443 unit tests (one existing live-provider smoke skipped), production build.
- pnpm test:e2e --workers=1: 90 passed (desktop/mobile, 6.8 minutes). Earlier attempts were interrupted by missing TEST_DATABASE_URL and a stopped Docker Desktop engine, with saving timeouts before recovery. Recovered full run used unchanged tests/assertions.
- pnpm format:check and strict OpenSpec validation: passed before archive; repeated after archive.
- Inline spec, TypeScript and clinical engineering review: scope conforms; explicit fictional negatives, nullable facts, patient-reported provenance, demonstrative labels and physician publication gates preserved. No separate reviewer was claimed for this inline review. AO native review follows PR creation.
- No UI changes; no manual browser inspection or live provider call. Engineering verification is not medical validation.
- User ownership constraint takes precedence over the generic index-update step: shared backlog index unchanged; this closes only the assigned STATUS gap.
