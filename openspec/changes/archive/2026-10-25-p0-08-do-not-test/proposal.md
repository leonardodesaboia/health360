## Why

[P0-08](../../../docs/backlog/IMPLEMENTATION.md#p0-08) must show the HISIC "Do Not Test" moment. A repeat-screening patient (age 60, normal, complete, adequately prepared colonoscopy in 2022) receives a preliminary "possible redundant test" proposal. A physician can trace it to the demonstrative rule, the data considered, its limits and its evidence. It must never reach the patient as advice before review.

## What Changes

- Add optional, additive `ruleReferences` (rule ID, rule version, evidence version, demonstrative validation, deterministic rationale) to RecommendationProposal JSON. The server stamps them from evaluator findings, never from model output.
- Cover redundant, non-redundant, unknown-date and missing-date cases through the persisted analysis path with the mock provider, including rule/proposal traceability and the patient status boundary.

## Capabilities

### New Capabilities

- `do-not-test`: traceable, preliminary possible-redundancy proposals.

### Modified Capabilities

None.

## Impact

Touches `src/features/patients/contracts.ts` (additive optional field), `src/server/analysis/prepare.ts`, and tests. No SQL migration, because proposal payloads are JSON. Physician reader and decision UI (P0-09/P0-10) and patient plan (P0-11) stay with their owners; they can read `ruleReferences`.
