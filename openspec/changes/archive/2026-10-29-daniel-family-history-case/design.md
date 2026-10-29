## Scope and boundaries

Keep `crc-screening-demo` v1 and the Alex/Jordan outcomes intact. Use a separate `family-history-screening` scenario and context with one deterministic early-start rule. Restrict it to never-screened, asymptomatic people with no relevant personal or syndromic history and one first-degree relative diagnosed before 60. Multiple affected relatives and diagnosis at 60 or older remain outside this demonstrative implementation; the source covers them, but the intake does not establish their count.

## Evidence verification

Accessed 2026-10-29: US Multi-Society Task Force on Colorectal Cancer (ACG, AGA and ASGE), 2017, _Colorectal cancer screening: Recommendations for physicians and patients from the U.S. Multi-Society Task Force on Colorectal Cancer_. Gastrointestinal Endoscopy 86(1):18-33. DOI 10.1016/j.gie.2017.04.003.

Full primary article on the issuer's official ASGE site: https://www.asge.org/home/resources/publications/guidelines/colorectal-cancer-screening-recommendations-for-physicians-and-patients-from-the-u.s.-multi-society-task-force-on-colorectal-cancer

Section "Family history of CRC and polyps", "Recommendations", item 1, HTML paragraph `p0315`, exact excerpt: "undergo colonoscopy every 5 years beginning 10 years younger than the age at which the youngest first-degree relative was diagnosed". The same sentence specifies one first-degree relative diagnosed before 60 or two affected first-degree relatives, and age 40 if earlier. Thus Daniel's father diagnosed at 50 establishes a start age of min(40, 50 - 10) = 40, with a five-year colonoscopy interval. The source labels this a weak recommendation with low-quality evidence. Software source verification is not medical validation.

Retrieval: web-browser requests to the old ASGE PDF and journal endpoints failed. The ACG-hosted guideline summary was initially inspected, but the orchestrator required full text; that summary is not the registered evidence. Direct Node fetch successfully retrieved the official ASGE full-article HTML (HTTP 200, 944808 bytes), including all article sections, tables, references and journal/DOI metadata, and the full recommendation was inspected. Rule parameters did not change.

## Implementation

- Extend nullable typed intake facts and conditional intake fields; use shared IntakeField and AnswerSummary for accessible unknown controls/profile display. Preserve older records as unknown.
- Map family facts on the server and select deterministic application-authored clarification fields. Never infer a negative or change rule/evidence authority through model output.
- Add a distinct context and rule, fail closed on missing evidence, symptoms, personal risk or family syndrome. Family-specific unknowns clarify before age-based rejection. Existing average-risk paths stay unchanged.
- Add Daniel records and prepared answers; preparation calls startIntake, completeIntake, analysis, and recordReview/finalization only. No direct status/review/plan inserts.
- Leave demo-controls-client.tsx until UX follow-up merge/rebase. Use existing presenter controls and labels.

## Validation plan

Record baseline counts before code changes. Reproduce failing Daniel rule and preparation tests, then implement. Cover qualifying age and boundaries, no family history, second-degree only, unknown degree/diagnosis, symptoms and syndrome, evidence rejection, existing outcomes, nullable profile/clarification mapping, producer-built legal histories and both prepared screens on desktop/mobile. Run verify, integration, build before full e2e with one worker, format and strict OpenSpec checks using a session-owned PostgreSQL container. Complete inline clinical/design/spec review and AO native PR review, green CI; user merges.
