# ADR0005: Shared integration contracts

- Status: accepted for landed APIs; review/clarification producer policy pending implementation
- Date: 2026-10-25

## Context

Parallel owners share dataset-scoped immutable records and administrative workflow
history. This records integration decisions and separates existing APIs from the
remaining P0-10/P0-12 producer work. All data is synthetic and
**DEMONSTRATIVE — NOT CLINICALLY VALIDATED**. Demo review is not medical validation.

## Decision

### Workflow and transaction ownership

Use `src/server/workflow/state.ts` for persisted state:

```ts
getWorkflowStatus(dbOrTx, datasetId, patientId); // status
getWorkflowState(dbOrTx, datasetId, patientId); // { status, lastTransition }
transitionWorkflow(dbOrTx, datasetId, {
  patientId,
  expectedFrom,
  expectedRefs, // optional compare-and-set against latest transition refs
  to,
  actor, // patient | system | demo-physician
  reason,
  refs, // profileVersion, analysisId, reviewId, planId (optional fields)
});
```

These illustrate API shapes, not executable calls with defined variables. Reads
acquire a dataset/patient transaction-scoped advisory lock. Root clients create a
transaction; pass an existing `tx` to retain the lock across domain writes.
`inDatasetTransaction(db, datasetId, (repo, tx) => ...)` supplies both handles.
`expectedFrom` rejects stale status; supplied `expectedRefs` fields also reject
superseded attempts even when status returns to the same value (the ABA race).
Mismatches throw `StaleStateError`; the pure graph throws `IllegalTransitionError`
for illegal edges. Append workflow history; never overwrite patient status snapshots.
Callers enforce actor scope, ownership, freshness, evidence and review gates.
This administrative API is not authentication.

### Timeline references

Coordinate new kinds and database reference-trigger migrations through one owner lane. Events
include entity ID/version, timestamp and provenance; readers validate links.

| Kinds                                                            | Referenced entity                                             |
| ---------------------------------------------------------------- | ------------------------------------------------------------- |
| PROFILE_UPDATED, CLARIFICATION_ANSWERED, REASSESSMENT_REQUESTED  | HealthProfile version                                         |
| INTAKE_COMPLETED                                                 | IntakeResponse ID, with entityVersion equal to profileVersion |
| ANALYSIS_CREATED, ANALYSIS_FAILED, CLARIFICATION_REQUESTED       | AIAnalysis                                                    |
| REVIEW_UPDATED, REVIEW_CLARIFICATION_REQUESTED, REVIEW_COMPLETED | MedicalReview                                                 |
| PLAN_PUBLISHED                                                   | PreventivePlan                                                |

Availability of a kind does not mean its producer exists. Review and clarification
producers still belong to P0-10/P0-12.

### Session and clinical context

`getDemoSession()` in `src/server/demo/session.ts` resolves an opaque httpOnly
cookie and returns `{ datasetId, patientId, caseId, patient, profile, examinations,
clinicalContext } | null`. Without a valid cookie it returns null without DB access.
The patient carries authoritative workflow status; profile is latest. Storage or
incomplete-record errors propagate without fixture fallback.

Invoke `selectDemoCaseForSession` and `resetDemoSession` only from server mutation
contexts (Server Actions/Route Handlers). `replaceDemoDataset` seeds the selected
case plus canonical `crc-screening-demo` v1, preserving full evidence/rule metadata.
Reuse that context; do not duplicate it in another lane. Resolve dataset scope on
the server, never from client-supplied record scope. Reset replaces only the browser's
dataset. A demo cookie provides no real identity or physician authorization.

### Typed intake facts and analysis boundary

Optional additive `HealthProfile.intakeFacts` holds patient-reported nullable
booleans, `priorScreening` (`NEVER_SCREENED | COLONOSCOPY | OTHER | null`) and
colonoscopy normal/complete/adequate-preparation facts. Unknown is null. Examination
result values use canonical `Normal`/`Abnormal` wording.

The analysis mapper uses tri-state OR: any true → true; all false → false; otherwise
null. Symptoms combine rectalBleeding, bowelChange, weightLoss; personal risk combines
colorectalCancer, polyps, ibd, hereditaryCancerSyndrome, serratedPolyposis; family
risk combines familyCrc, familySyndrome. Missing typed facts never become negative.

First draft save starts NOT_STARTED → INTAKE_IN_PROGRESS; reassessment can also
start from REASSESSMENT_PENDING. Confirmed submit atomically stores intake, exams
and profile vN+1, transitions INTAKE_IN_PROGRESS → INTAKE_COMPLETED as patient with
`refs.profileVersion`, and redirects to `/patient/analysis`. Intake does not claim
analysis or publish a plan.

### Analysis claim, evaluate and persist

`runAnalysisForSession(db, session, { beforeClaim? })` in
`src/server/analysis/run.ts` is server-only, not a Server Action. Pass a session
resolved by `getDemoSession`. It wraps configuration/audit metadata and `analyzeSession`.

1. Transaction one locks workflow, verifies a legal claim, invokes optional
   `beforeClaim(repo, tx, status)`, reads the latest profile, and reserves
   ANALYSIS_PENDING with `refs.analysisId` and profile version. Claimable states:
   INTAKE_COMPLETED, ANALYSIS_FAILED, CLARIFICATION_REQUIRED, REASSESSMENT_PENDING.
2. Deterministic evaluation and bounded LLM explanation run **outside transactions**.
   Minimize input. The model cannot alter rule status or invent evidence/category scope.
3. Transaction two checks profile/context freshness and reservation ownership with
   `expectedRefs.analysisId`, appends immutable analysis with nested proposals and
   event, and transitions to MEDICAL_REVIEW_PENDING, CLARIFICATION_REQUIRED or ANALYSIS_FAILED.

Failures retain bounded `failureReason` and no proposals; `promptId` is optional audit
metadata. Successful identical inputs reuse results; retries preserve history and
superseded attempts cannot complete. Unknown required information clarifies;
excluded cases or invalid/provider-failed results block. Never publish a fallback.

### Clarification and physician finalization policy

**P0-10/P0-12 producer contracts, not completed features on main:** questions come
from deterministic analysis missing fields and physician CLARIFY requests, always
with an explicit “I don't know” option. This is a restricted form, not a chatbot.
Clarification appends profile vN+1 in `beforeClaim`, atomically with
CLARIFICATION_REQUIRED → ANALYSIS_PENDING. Exceptions roll back both writes.

Intended decisions are APPROVE, MODIFY, REJECT, PENDING and CLARIFY. MODIFY needs
revised text and reason; REJECT needs reason; CLARIFY needs question text. CLARIFY
saves a DRAFT MedicalReview and moves MEDICAL_REVIEW_IN_PROGRESS → CLARIFICATION_REQUIRED
as demo-physician. The core decision enum already includes CLARIFY, but the producer and question
validation are not implemented. DRAFT describes an unfinished review; the current
core review uses nullable `completedAt`, not a persisted DRAFT status field.

Explicit finalization must reject pending/clarification decisions, incomplete reviews
and stale versions. In the same serialized transaction it persists the finalized
review, moves to MEDICAL_REVIEW_COMPLETED and calls the existing
`publishReviewedPlan(tx, datasetId, patientId, reviewId)` → PLAN_AVAILABLE.
Publication validates reviewed text, evidence and references, is idempotent for a
review, and appends only its plan/event/transition. Page reads never publish.
Physician decision history is still in progress.

### Reassessment

An existing reviewed plan can request PLAN_AVAILABLE → REASSESSMENT_PENDING with
current profile/plan checks and a request event. Intake resumes prefilled, then
passes through INTAKE_IN_PROGRESS and INTAKE_COMPLETED with profile vN+1. Analysis,
a new finalized review and publication are required for plan v2. Preserve plan v1,
labeled previous while the next cycle is unfinished. History/restart and intake
wiring exist; full two-cycle completion still needs finalization.

## Consequences

Coordinate shared changes in `src/features/patients/contracts.ts`,
`src/server/db/records.ts` and workflow APIs with their owners first. Transaction
helpers and graph adjacency never replace publication gates. See
[STATUS](../STATUS.md) for delivery and [CONTRIBUTING](../CONTRIBUTING.md) for pickup.
