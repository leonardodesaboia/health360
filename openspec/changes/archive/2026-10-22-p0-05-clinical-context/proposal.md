## Why

[P0-05](../../../../docs/backlog/IMPLEMENTATION.md#p0-05) needs a bounded, honest demo story and deterministic checks before the HISIC demonstration on Nov 3, 2026.

## What Changes

- Add two synthetic colorectal screening scenarios, versioned public evidence and demonstrative rules.
- Evaluate eligibility, exclusions, missing facts and possible repeat-test redundancy without an LLM or database.
- Provide fixture expectations for Flows A–E and an English demo story.

## Capabilities

### New Capabilities

- `clinical-rules`: restricted, versioned screening context and fail-closed deterministic results.

### Modified Capabilities

None.

## Impact

Code stays under `src/server/clinical-rules`; tests use the existing HealthProfile and PreviousExamination contracts. P0-04 is satisfied through these contracts rather than merged intake code, as authorized by the wave brief. Structured screening facts are an additive local input contract; existing shared contracts remain unchanged. Add the server-only marker dependency, scenario documentation and an architecture boundary note. No routes, persistence, provider calls, workflow mutation or publication service are included. English overrides older pt-BR guidance per the user's wave brief.

Tests cover positive, negative, unknown, invalid input, mismatched examinations, unsupported context/version and evidence rejection. Review uses the spec and clinical-safety checklists inline; full verification follows before archive and PR.
