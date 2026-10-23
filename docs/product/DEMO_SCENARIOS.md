# HISIC synthetic scenario pack

**DEMONSTRATIVE — NOT CLINICALLY VALIDATED**

Prepared for Nov 3, 2026. Every person, report and expected outcome is invented.
The software demonstrates restricted decision support; it does not establish a
diagnosis, recommend care autonomously or claim medical validation. Physician
review and explicit finalization remain mandatory before any patient plan.

## The story judges will see

**First screening:** a synthetic 50-year-old reports no colorectal screening and
explicitly denies symptoms and the listed personal/family risk exclusions. The
rule identifies a preliminary opportunity to discuss screening options. The
physician must verify the context and decide what belongs in the plan.

**Possible repeat redundancy:** a synthetic 60-year-old reports a normal colonoscopy
on Nov 3, 2022, complete to the cecum with adequate preparation. The same risk
exclusions are explicitly absent. On Nov 3, 2026, a routine repeat is flagged as
**possibly redundant**, pending verification of the report and indication. This
flag never means that every recent test is unnecessary.

Remove the date to show clarification: “When was your previous colonoscopy?
You can answer ‘I don't know.’” An unknown answer remains unknown and produces
no interval-based finding. Restore the date in a new profile version to return
to review. For the first case, unknown age is the clarification variant.

Introduce new symptoms in profile v2 to demonstrate reassessment. The routine
screening rule stops applying, and the old reviewed plan must remain preserved
while a new assessment is prepared. No replacement advice is generated here.

## Executable expectations and integration boundary

`src/server/clinical-rules/scenarios.ts` exports parsed case inputs, fresh variants
and per-case A–E expectations. `evaluateScreening(unknown)` validates the existing
HealthProfile and PreviousExamination contracts plus local screening facts.
`loadClinicalContext(scenarioId, 1)` rejects unavailable scenarios/versions.

| Flow | Expected behavior                                                                                                                                                          |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A    | Baseline finding enters physician review; finalized decisions determine the future plan.                                                                                   |
| B    | Repeat case flags possible redundancy; first case is a negative control. Symptoms, risk, abnormal results or poor quality prevent a redundancy finding.                    |
| C    | Unknown date/age requires clarification; resolving it requires a new profile/analysis version. Unknown answers cannot unlock a finding.                                    |
| D    | New symptoms in v2 exclude routine screening; preserve plan v1 and request reassessment.                                                                                   |
| E    | Downstream timeout, malformed output or unsupported evidence must fail analysis; no fallback recommendation or automatic publication. A valid retry still requires review. |

Only rule behavior and fixture expectations are implemented in this slice.
Persistence, LLM orchestration, review, plan publication and complete browser
journeys belong to their respective tasks. These fixtures do not claim those
future flows pass. All results carry `mayPublish: false`, rule provenance,
versions, considered facts, limitations and the demonstrative label. Consumers
must display that label wherever this content appears and keep findings out of
patient views until finalized review.

## Structured facts and limits

All clinical booleans accept `null`; omitted fields are invalid. `symptoms` asks
about signs/symptoms relevant to colorectal assessment. `personalRiskHistory`
covers colorectal cancer, polyps (including serrated polyposis), inflammatory bowel
disease and hereditary cancer syndromes. `familyRiskHistory` covers colorectal
cancer and hereditary colorectal cancer syndromes. A true answer excludes this
restricted average-risk demo. These combined questions are demonstrative scope
guards, not a comprehensive intake or procedure contraindication checklist.

`priorScreening` is `NEVER_SCREENED`, `COLONOSCOPY`, `OTHER` or null. Other
strategies and surveillance are outside this rule. A colonoscopy requires exactly
one linked record named `Colonoscopy`, result `Normal`, and explicit `normal`,
`complete` and `adequatePreparation` facts. Normal means no neoplastic findings;
adequate preparation means adequate to detect lesions over 5 mm. An absent record,
contradiction, duplicate, foreign-patient record or future date blocks evaluation.
Unrelated extra exams conservatively block this restricted pack; do not silently
discard them. Existing profile missing-information entries also require clarification.
Medication and habit nulls are preserved but do not determine this narrow rule.
Free-text history is never interpreted as a negative finding. Intake consumers must
collect these facts explicitly and bind them to the persisted profile version.

Age eligibility is 45–75 inclusive. The repeat interval uses ten calendar years,
with a Feb 29 anniversary clamped to Feb 28 in a non-leap year. At the anniversary,
the possible-redundancy flag becomes a preliminary screening discussion opportunity.
The implementation narrows public guidance to a demo; it is not the full guideline.

## Evidence register

Both references have evidence version 1, `validation: demonstrative` and
`medicallyReviewed: false`. A public source is not clinical approval. No placeholder
is used to support the current findings; placeholder or unknown evidence fails the
rule evidence check.

- **uspstf-crc-2021** — US Preventive Services Task Force, _Colorectal Cancer:
  Screening — Clinician Summary_, 2021.
  [Public source](https://www.uspreventiveservicestaskforce.org/uspstf/document/ClinicalSummaryFinal/colorectal-cancer-screening).
  Accessed Oct 22, 2026; full clinician summary read. Supports age-appropriate,
  asymptomatic average-risk screening; the demo does not choose a test autonomously.
- **usmstf-colonoscopy-2020** — US Multi-Society Task Force on Colorectal Cancer,
  _Recommendations for Follow-Up After Colonoscopy and Polypectomy: A Consensus
  Update_, 2020. [Public primary publication](https://pmc.ncbi.nlm.nih.gov/articles/PMC7393611/).
  Accessed Oct 22, 2026; URL, title and relevant interval/exclusion passage verified
  in indexed primary-source text. Direct automated PMC access presented a CAPTCHA;
  full-page retrieval was unavailable. Supports the normal-examination interval and
  quality/risk limitations. Formal medical review remains outstanding.
