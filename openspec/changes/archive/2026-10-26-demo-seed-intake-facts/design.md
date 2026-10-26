## Approach

Author explicit negative symptom/personal/family answers in preparedInput in src/server/clinical-rules/scenarios.ts. These are fictional scenario facts, never defaults inferred from missing input or legacy prose. Use the existing HealthProfile intakeFacts schema. Alex has NEVER_SCREENED with null colonoscopy quality answers; Jordan has COLONOSCOPY with normal/complete/adequate preparation true. demoCaseRecords and replaceDemoDataset persist the same typed snapshots without translation.

Keep new-symptoms typed rectalBleeding consistent with aggregate symptoms. Unknown-date keeps a null performedAt. No server services, workflow transitions or publication rules change.

## Verification mapping

- Unit: validate every typed field, compare mapIntakeFacts with authored aggregate facts, evaluate stored baseline profiles and variants, preserve unknown medication and null clinical facts, ensure cloned records are independent.
- DB: replace/select each case, load persisted facts, advance only legal intake workflow transitions (no profile rewrite), analyze through analyzeSession and the real MockProvider, assert category/rule and no published plan. Variants append a new scenario profile/exam snapshot and remain clarification/out-of-scope.
- Run full verify, e2e, format and strict OpenSpec validation; review clinical boundaries and TypeScript inline before archive.

## Scope

This is the assigned STATUS gap repair, not completion of the wider P0-02 backlog item. Leave the shared ordered index unchanged under the user's explicit ownership constraint. OpenSpec artifacts and promoted baseline spec are required by the task's explicit lifecycle request.
