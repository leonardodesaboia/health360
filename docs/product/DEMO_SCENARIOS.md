# HISIC synthetic scenario pack

**DEMONSTRATIVE — NOT CLINICALLY VALIDATED**

Prepared for Nov 3, 2026. Every person, report and expected outcome is invented.
The software demonstrates restricted decision support; it does not establish a
diagnosis, recommend care autonomously or claim medical validation. Physician
review and explicit finalization remain mandatory before any patient plan.

## Daniel: separate first-degree family-history scenario

**DEMONSTRATIVE — NOT CLINICALLY VALIDATED.** Daniel Example is a fictional
40-year-old man, asymptomatic, never smoked, without relevant personal history
and never screened. His father was diagnosed with colorectal cancer at 50.
`family-history-screening` uses its own `crc-family-history-demo` v1 context;
Alex/Jordan and `crc-screening-demo` v1 retain their existing rules and evidence.

The separate `crc-family-history-early-start` rule generates only a preliminary
PREVENTIVE_OPPORTUNITY. It implements the first-degree relative diagnosed before
60 branch of the 2017 USMSTF source: start at 40 or ten years before the youngest
diagnosis, whichever is earlier, with a five-year colonoscopy interval. Daniel's
start age is 40 because of his father's history, not the average-risk age-45
criterion. Two affected relatives at any age and a single relative diagnosed at
60 or older are described by the source but not implemented by this restricted
rule; the intake does not establish relative count. The demo retains a 75-year
upper scope bound and excludes previous screening/surveillance.

`familyCrcFirstDegree` and `familyCrcDiagnosisAge` are additive nullable typed
facts. Unknown relative degree or diagnosis age requires clarification. Missing
legacy values remain unknown. Second-degree-only history and absent family
history do not qualify at 40. Symptoms, relevant personal history and family
Lynch/FAP remain out of scope. `familyCrc` and `familySyndrome` retain their
existing meanings, and the LLM cannot change the deterministic result or evidence.

Evidence **usmstf-crc-family-history-2017**, version 1: US Multi-Society Task Force
on Colorectal Cancer (ACG, AGA, ASGE), _Colorectal cancer screening:
Recommendations for physicians and patients from the U.S. Multi-Society Task Force
on Colorectal Cancer_, 2017, Gastrointestinal Endoscopy 86(1):18–33,
DOI 10.1016/j.gie.2017.04.003. [Full primary article on ASGE](https://www.asge.org/home/resources/publications/guidelines/colorectal-cancer-screening-recommendations-for-physicians-and-patients-from-the-u.s.-multi-society-task-force-on-colorectal-cancer),
accessed October 29, 2026. Verified in **Family history of CRC and polyps →
Recommendations → item 1** (`p0315`). The source calls this a weak recommendation
with low-quality evidence. Registered as `public_source`, `validation: demonstrative`,
`medicallyReviewed: false`; software verification is not clinical validation.

Mock-only `daniel-review` and `daniel-plan-v1` are built through real producers.
The latter includes a fictional physician modification and explicit finalization
before publishing plan v1. See [presenter segment](DEMO_SCRIPT.md#optional-daniel-segment-about-45-seconds).

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

## Structured facts and limits (original average-risk scenarios)

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

## Evidence register (original average-risk scenarios)

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
