## Boundaries

`src/server/clinical-rules/contracts.ts` wraps the existing HealthProfile and PreviousExamination schemas with explicit nullable screening facts. Free-text history is never interpreted as absence of risk. Facts are linked to the profile version by inclusion in the same validated request; callers must persist them with that version and must not infer clinical facts from missing text.

`context.ts` owns version 1 of a fixed context, evidence and rule thresholds; loaders return fresh validated copies and reject arbitrary scenario IDs or versions. `evaluate.ts` is a pure synchronous server-only function. `scenarios.ts` supplies two parsed synthetic cases and executable A–E expectation fixtures. Tests mock only the server-only import marker, never domain behavior.

## Demo and failure behavior

Case 1: age 50, asymptomatic, explicitly absent risk factors, never screened: preliminary prevention opportunity. Case 2: age 60 with a normal, complete, adequately prepared colonoscopy dated Nov 3, 2022: possible redundancy of routine repeat screening before the ten-year anniversary. This is not a contraindication to diagnostic testing. Unknown date requires clarification; new symptoms block this routine screening scope and motivate a new assessment. Age outside 45–75, risk factors, non-normal/poor-quality examinations and other screening strategies are excluded from this deliberately narrow demo.

Known exclusions win over missing facts. Invalid requests, unlinked/contradictory exam records, future dates and unavailable context versions block. Required nulls produce bounded clarification fields. Findings always carry rule/evidence versions, considered data, limits, demonstrative labeling, rule provenance and physician-review requirements. Results never grant publication; Flow E expectations specify downstream provider failure without simulating provider behavior here.

## Test mapping

The colocated test suite exercises both prepared cases, 45/75 and 44/76 age boundaries, exact ten-year/date boundaries, each tri-state risk/quality field, date/result uncertainty, malformed and cross-patient records, context/evidence validation, immutable copies and A–E fixture outcomes. Full verification covers regression only; it does not prove the future persisted A–E journeys.
