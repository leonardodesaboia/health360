# Navigation and workflow

## Current routes

`/` redirects to `/patient`. Patient navigation is Home, My plan and History; the home
shows a case-selection entry state without a demo session. Once a case is selected,
it links to `/patient/intake`. Requested reassessment resumes intake from
REASSESSMENT_PENDING; the form restores answers for the latest profile version
within that dataset. Confirming updates appends profile vN+1, completes intake and
opens `/patient/analysis`. Analysis and a fresh physician review are required for a
new plan; the prior reviewed plan stays preserved. The plan page loads the selected
dataset's reviewed plan or explains the current session, review, clarification or
blocked state. It never displays preliminary proposals. Previous reviewed content
remains identified as previous during a new cycle.
`/doctor` lists the latest persisted analysis for the selected demo session patient. Without a session or analysis it shows an empty state. Opening an entry navigates to `/doctor/reviews/<analysis-id>--v<version>`. The reader shows the exact analyzed profile/context, proposal criteria, evidence versions, uncertainty and stale-version warnings. Unknown or foreign IDs disclose no records. Opening a current review moves it from awaiting review to review in progress; it never completes a review or publishes a plan.

`/showcase` is the shared-component verification route, reachable directly by URL.
It is intentionally absent from presenter-facing navigation and the footer.

The demo role link changes between `/patient` and `/doctor`. It is neither login
nor authorization. Reassessment mutations go through the server workflow service;
navigation alone does not complete an analysis, review or publication.
The plan page reads persisted records and never publishes on a
page visit. Review finalization invokes guarded plan publication inside the same
serialized dataset transaction after completeness and evidence checks.
No route reveals unreviewed proposals as patient guidance.

## Physician decisions

In the versioned workspace, each preliminary proposal supports Approve, Modify,
Reject, Leave pending and Request clarification. Modify requires a reason and
revised text; Reject requires a reason. Save decisions creates an immutable draft
with the server-assigned demonstration reviewer, actual time and analysis version.
Reloading restores the committed decisions. A competing draft or stale analysis
fails visibly and retains unsaved input until the reviewer reloads.

Finalize review is explicit and unavailable while any proposal is pending or asks
for clarification. The server independently checks completeness, dataset/patient
ownership, current profile/context/analysis versions, evidence and expected review
version. Finalization and guarded plan publication commit atomically through the
existing owner service. A failed transaction publishes no partial result; a
finalized review cannot be changed or finalized again.

Request clarification requires a plain-English question for the patient and can
name one related intake question. Saving it keeps completedAt empty and transitions
through CLARIFICATION_REQUIRED. Updated information and a new analysis are required;
there is no direct return to review or publication. Blocked records display
system-generated status and rule-generated context rather than AI attribution.
A read-only decision history lists each saved review version with its decisions,
reasons, revised text and questions; the reviewer is labeled as a demo reviewer,
not a real clinician. All decisions remain synthetic demonstrations, without
clinical validation.

## Patient history

`/patient/history` lists actual linked events with provenance and versions, and
links reviewed plan versions through `/patient/history/[planId]`. Historical
URLs are scoped to the selected demo dataset and patient; missing or unreviewed
plans return 404. Earlier plans remain labeled previous while a new cycle is
unfinished. A missing session shows case-selection guidance without records.

Updating information from a reviewed plan starts REASSESSMENT_PENDING through
the canonical workflow service, records the request and opens the existing
intake. Intake submission owns the new profile version and analysis trigger;
analysis and physician review must complete again before the next plan is
published. Repeating an unfinished update does not duplicate the start event.

## Clarification (P0-12)

When analysis needs more information, `/patient/analysis` links to
`/patient/clarification`. Each supported missing fact receives a bounded English
question and an I don't know option. Known grouped facts are preserved; only their
unknown underlying facts are asked. Reloading restores the current persisted
version. Unsupported requests stay unavailable rather than becoming open-ended chat.

Confirming answers atomically appends profile vN+1 and reserves ANALYSIS_PENDING,
then invokes the exported analysis service. A new preliminary analysis must still
go through physician review; no plan is published. Unknown answers can return to
CLARIFICATION_REQUIRED, and timeouts keep the saved profile with explicit failure.
An interrupted call can be resumed from Continue saved analysis, without another
profile version. An old form cannot overwrite a newer profile or analysis.

Physician-origin clarification uses the typed open-request reader from the current
incomplete review. The patient sees the physician's question, with a bounded input
when a known intake field is named or a text answer when no field is named. Both
offer I don't know. Questions and patient-reported answers remain linked to the
review version; a superseded review form cannot write. Free text remains a local
patient-reported note and is not inferred into clinical facts. Reanalysis starts a
new review while the earlier incomplete review remains preserved. Free-text review
reasons are never interpreted as patient questions.

## Administrative lifecycle

The pure graph in `src/features/workflow/workflow.ts` is the canonical adjacency
definition. The matrix below documents every allowed edge; all other pairs, including
self-transitions, throw. Future services must enforce actor, evidence and version
preconditions **before** applying a transition.

| From                       | Allowed next                                                    | Future service precondition                                  |
| -------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------ |
| NOT_STARTED                | INTAKE_IN_PROGRESS                                              | Synthetic case selected                                      |
| INTAKE_IN_PROGRESS         | INTAKE_COMPLETED                                                | Required answers validated or explicitly unknown             |
| INTAKE_COMPLETED           | INTAKE_IN_PROGRESS, ANALYSIS_PENDING                            | Edit or submit current profile version                       |
| ANALYSIS_PENDING           | ANALYSIS_FAILED, CLARIFICATION_REQUIRED, MEDICAL_REVIEW_PENDING | Failure, required gap, or fully validated preliminary result |
| ANALYSIS_FAILED            | ANALYSIS_PENDING, INTAKE_IN_PROGRESS                            | Bounded retry or correction; never publication               |
| CLARIFICATION_REQUIRED     | ANALYSIS_PENDING                                                | Clarification persisted, including explicit unknown          |
| MEDICAL_REVIEW_PENDING     | MEDICAL_REVIEW_IN_PROGRESS                                      | Authorized reviewer starts current analysis                  |
| MEDICAL_REVIEW_IN_PROGRESS | CLARIFICATION_REQUIRED, MEDICAL_REVIEW_COMPLETED                | Ask for gap or all required decisions recorded               |
| MEDICAL_REVIEW_COMPLETED   | PLAN_AVAILABLE                                                  | Explicit publication, fresh versions, no pending decisions   |
| PLAN_AVAILABLE             | REASSESSMENT_PENDING                                            | New information; old plan/version preserved                  |
| REASSESSMENT_PENDING       | INTAKE_IN_PROGRESS, ANALYSIS_PENDING                            | Needs edits or complete updated profile                      |

These are proposed MVP lifecycle policies, not medically validated criteria.
The graph intentionally cannot make backend assertions; tests cover every pair,
the main cycle, retry and clarification. A server action must never treat a client
status string or UI click as proof of completed analysis/review.

## Future journeys

First evaluation: intake → versioned profile → validated analysis → physician
review → reviewed plan. Do Not Test: prior examination → restricted deterministic
check → contextual explanation → physician decision → plan; recent does not mean
unnecessary. The preliminary possible-redundancy proposal (rule ID/version, considered
examination data, limits, evidence) exists through the review queue stage (P0-08). Clarification returns through profile update and analysis. Reassessment
creates new versions and preserves earlier cycles. AI failure blocks analysis and
publication until a safe retry succeeds.

Executable foundation tests are in `tests/e2e/foundation.spec.ts`. Full A–E Given /
When / Then acceptance specs and prerequisites are in
[the canonical ordered index and flow specs](docs/backlog/IMPLEMENTATION.md#future-end-to-end-acceptance-specifications); they are not claimed
as functioning flows in this setup.

## Guided draft intake (P0-03)

At `/patient/intake`, enter synthetic age and the configured symptom/history
answers. Unknown is explicit and never treated as a negative answer. Save and
continue validates the current step; Back preserves unvalidated draft answers.
Save draft permits incomplete answers and restores the saved step after refresh.
Storage and stale-revision failures remain visible; reloading the saved draft
replaces unsaved form edits. P0-04 extends this journey through habits, previous screening/examinations and review.
Review supports editing any step. Explicit confirmation saves one immutable profile
version and completed intake atomically in the browser-local demonstrator. Repeating
unchanged confirmation does not create another version. Stale edits fail visibly.
The consolidated `/patient/profile` shows declared versus unknown data and structured
version/update metadata, with no score or medical approval claim. For a selected
session, confirmation instead persists through the server adapter and redirects to
/patient/analysis; analysis starts through its separate action.

## Persisted administrative state

Server services can now read and append workflow history through
`src/server/workflow/state.ts`. A required expectedFrom guards stale writes; a
per-patient transaction lock serializes concurrent changes. Actor, time, version
and optional reason/profile/analysis/review/plan references remain in immutable
audit history. This API does not change the graph above or establish that a
clinical precondition passed. Callers must enforce those checks atomically with
the transition. Implemented intake, analysis, review and reassessment actions use these guarded server transitions. The only navigation-triggered transition is opening a current physician review (pending to in progress).

## Analysis stage (P0-07)

After persisted intake completion, `analyzeCurrentDemo` loads the latest profile for
the cookie-selected demo dataset. It reserves ANALYSIS_PENDING through the shared
workflow API, evaluates deterministic rules and requests a bounded explanation from
the configured provider. The completion transaction verifies the same profile,
context and reservation before recording the result and its timeline event.

- Valid preliminary proposals enter MEDICAL_REVIEW_PENDING.
- Required gaps enter CLARIFICATION_REQUIRED without proposals.
- Provider failures, invalid output, unsupported evidence or excluded cases enter
  ANALYSIS_FAILED without proposals. Retry returns through ANALYSIS_PENDING.
- An updated input or superseding reservation prevents a stale completion.

`/patient/analysis` displays administrative status and the next permitted action.
Patients do not see preliminary proposal content there. The server action never
writes a plan or completes physician review. Shared timeline kinds distinguish
ANALYSIS_CREATED, ANALYSIS_FAILED and CLARIFICATION_REQUESTED; the latter two still
reference the immutable AIAnalysis version.

## Evaluation presentation

The four informational stages are Intake → Analysis → Physician review → Plan.
`src/features/workflow/presentation.ts` derives them from recorded current-cycle
status, never from navigation, elapsed time, pending requests or local decisions.
Confirmed intake makes analysis ready; analysis remains incomplete while pending,
failed or awaiting clarification. Review is current only after reviewable analysis,
and complete only after recorded finalization. Plan completes only with
PLAN_AVAILABLE plus a current plan returned by the existing guarded reader.
Without that read, guidance says Review finalized / Check plan status.

Clarification shows Information needed → Analysis again → Physician review.
Reassessment resets the current cycle; a previous plan remains previous even after
intake advances. Existing guarded route readers retain actual versions and dates.
The shared model carries only a version-free preservation message. Failed reads
remain errors, never proof that no plan exists.

Home, plan and history guidance points directly to intake, analysis, clarification
or plan status as appropriate. Task routes retain one existing form; waiting
analysis/review offers Refresh status through router.refresh, without starting a
new analysis. Saved-analysis continuation is offered only where the existing
clarification reader exposes recovery. Patient guidance never contains proposals,
rationale or unreviewed AI text.

Patient view and Physician view · Demo reviewer remain visible beside the full
DEMONSTRATIVE — NOT CLINICALLY VALIDATED banner. The role switch says Demo navigation
only; no sign-in or authorization. Presenter controls contain case switching,
prepared starting points and reset, closed after selection and navigation. With no
session, selection is expanded. Case identity, starting-point label and any errors
remain visible outside the closed disclosure. No local preference is persisted.
