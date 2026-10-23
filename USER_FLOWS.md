# Navigation and workflow

## Foundation routes

`/` redirects to `/patient`. Patient navigation is Home and My plan; the home
links to the read-only `/patient/intake` reference. The plan page loads the selected
dataset's reviewed plan or explains the current session, review, clarification or
blocked state. It never displays preliminary proposals. Previous reviewed content
remains identified as previous during a new cycle.
`/doctor` lists one synthetic reference record; opening it navigates to
`/doctor/reviews/demo-review-01`. Unrecognized IDs return 404.
`/showcase` is the shared-component verification route, linked in the shell/footer.

The demo role link changes between `/patient` and `/doctor`. It is neither login
nor authorization. The plan page reads persisted records and never publishes on a
page visit. The review finalization service invokes guarded plan publication inside
the same serialized dataset transaction.
No route reveals unreviewed proposals as patient guidance.

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
unnecessary. Clarification returns through profile update and analysis. Reassessment
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
replaces unsaved form edits. This slice does not complete intake or start analysis.

## Persisted administrative state

Server services can now read and append workflow history through
`src/server/workflow/state.ts`. A required expectedFrom guards stale writes; a
per-patient transaction lock serializes concurrent changes. Actor, time, version
and optional reason/profile/analysis/review/plan references remain in immutable
audit history. This API does not change the graph above or establish that a
clinical precondition passed. Callers must enforce those checks atomically with
the transition. Existing screens still perform no transitions.
