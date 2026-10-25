# Navigation and workflow

## Foundation routes

`/` redirects to `/patient`. Patient navigation is Home, My plan and History; the home
links to the read-only `/patient/intake` reference. The plan page loads the selected
dataset's reviewed plan or explains the current session, review, clarification or
blocked state. It never displays preliminary proposals. Previous reviewed content
remains identified as previous during a new cycle.
`/doctor` lists one synthetic reference record; opening it navigates to
`/doctor/reviews/demo-review-01`. Unrecognized IDs return 404.
`/showcase` is the shared-component verification route, linked in the shell/footer.

The demo role link changes between `/patient` and `/doctor`. It is neither login
nor authorization. Reassessment mutations go through the server workflow service;
navigation alone does not complete an analysis, review or publication.
The plan page reads persisted records and never publishes on a
page visit. The review finalization service invokes guarded plan publication inside
the same serialized dataset transaction.
No route reveals unreviewed proposals as patient guidance.

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
version/update metadata, with no score or medical approval claim. No analysis starts.

## Persisted administrative state

Server services can now read and append workflow history through
`src/server/workflow/state.ts`. A required expectedFrom guards stale writes; a
per-patient transaction lock serializes concurrent changes. Actor, time, version
and optional reason/profile/analysis/review/plan references remain in immutable
audit history. This API does not change the graph above or establish that a
clinical precondition passed. Callers must enforce those checks atomically with
the transition. Existing screens still perform no transitions.

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
