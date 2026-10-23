## Contract and scope

P0-07 supplies allowedProposals and SYSTEM_STRUCTURED personalHistory entries formatted as "Rule <ruleId>, version <positive integer>; evidence version <positive integer>: <rationale>". This format is read only in the explicit deterministic mock. No analysis input/output schema change is needed.

The mock emits one preliminary proposal per allowed entry, with exactly that category, single rule ID and complete evidence-ID list. It copies the matching supplied rationale and records the supplied versioned record as considered data. Neutral fixed titles add no clinical decision. It preserves the missing-information list and demonstrative/physician-review limitations.

Missing, malformed, duplicate or patient-reported rationale records block output rather than inventing explanations. Evidence versions must match the supplied sources; the existing analysis boundary still rejects unknown/placeholder evidence and unsupported scope. Empty allowed scope produces no proposals even when unrelated history mentions other rules. Explicit result injection remains available for failure tests.

## Plan and proof

First reproduce the empty-proposal defect using P0-07's exact payload shape. Add negative tests for missing, malformed, ambiguous, patient-reported or stale support and out-of-scope history, plus deterministic output and input immutability. Implement only MockProvider, update its architecture description, then run full verification and desktop/mobile e2e. Review clinical, TypeScript, security and spec conformance inline. Archive only after checks pass; request native AO review on the new PR.
