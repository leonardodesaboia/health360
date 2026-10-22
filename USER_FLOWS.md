# Navigation and workflow

## Foundation routes

`/` redirects to `/patient`. Patient navigation is Início and Meu plano; the home
links to the read-only `/patient/intake` reference. The plan page explains why no
plan exists; history is described there for later versioned cycles, without a dead link.
`/doctor` lists one synthetic reference record; opening it navigates to
`/doctor/reviews/demo-review-01`. Unrecognized IDs return 404.
`/showcase` is the shared-component verification route, linked in the shell/footer.

The demo role link changes between `/patient` and `/doctor`. It is neither login
nor authorization. No screen writes data or executes a workflow transition.
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
[the canonical OpenSpec flow specs](openspec/changes/p0-14-demo-acceptance/specs/end-to-end-flows/spec.md); they are not claimed
as functioning flows in this setup.
