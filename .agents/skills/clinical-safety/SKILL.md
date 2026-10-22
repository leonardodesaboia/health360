---
name: clinical-safety
description: Review clinical data, provenance, uncertainty, analysis display and physician publication boundaries in Health360.
---

Read AGENTS.md clinical boundaries and docs/product/PRODUCT_CONTEXT.md sections 3, 4, 12, 16 and 19.
Use synthetic data only. Distinguish declared information, structured facts, rule findings, AI explanations and physician decisions visibly and in contracts.
Unknown is not negative. Never fill missing data with plausible clinical facts. Do not invent evidence or medical statistics.
Do not present a schema-valid output, fictional reviewer action or software test as clinical validation.
Before enabling publication, require server authorization, current profile/analysis/context versions, permitted categories, valid supplied evidence IDs, completed decisions and explicit medical review.
API failure, invalid schema, missing evidence, contradictory inputs and incomplete information must block or request review. No automatic publication on retry.
Test unauthorized access, stale versions, unknown evidence, review bypass and error recovery when the relevant service is implemented.
This skill is engineering guidance, not a medical protocol. Escalate clinical criteria to a qualified medical owner; do not guess them.
