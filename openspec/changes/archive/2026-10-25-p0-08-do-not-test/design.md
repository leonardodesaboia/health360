## Context

P0-05 already has the demonstrative `crc-routine-repeat` rule (POSSIBLE_REDUNDANCY, 10-year interval after a reported normal, complete, adequately prepared colonoscopy). Its limitations include "A recent test alone does not establish redundancy." P0-07 persists proposals with rule IDs, evidence IDs, considered data and limits, but not the applied rule version or the deterministic rationale.

## Decisions

1. Add `ruleReferences?: { ruleId, ruleVersion, evidenceVersion, validation: "demonstrative", rationale }[]` to RecommendationProposal. It is optional so existing records stay valid.
2. `prepareAnalysis` builds `ruleReferences` only from the evaluator finding that matches each validated proposal. The model output schema stays strict, so a model that tries to supply or alter rule versions produces `invalid_output`.
3. The AI rationale remains an explanation of the supplied rule result. Considered data (including examination date and result) and limits stay deterministic.
4. Do not add a new rule or category. A missing or unknown examination date stays NEEDS_CLARIFICATION with no proposal. A colonoscopy beyond the interval produces PREVENTIVE_OPPORTUNITY, not redundancy.
5. The patient reader stays status-only. Proposals become patient-visible only through the P0-11 reviewed-plan path.
