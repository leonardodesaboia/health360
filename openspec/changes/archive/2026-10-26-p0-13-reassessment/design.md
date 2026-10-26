## Context

Events and plans are append-only, dataset-scoped shared records. The producer workers own their analysis/review/profile events. P0-11 owns guarded plan publication. History must not expose unreviewed proposal text.

## Goals / Non-Goals

Show actual linked events and preserved reviewed plans; route new information through reassessment, intake, analysis and physician review. No invented timeline activity, direct publication, predictive twin, plan comparison or duplicate intake mapper.

## Decisions

- Pure timeline projection filters to the selected patient, verifies entity/version links, removes semantic duplicates and sorts by timestamp with stable ties. Labels distinguish profile creation/update, intake, analysis, review and publication; provenance stays visible.
- Server history loading uses the session dataset repository, never a URL-supplied dataset or patient. Plan metadata and historical content are checked by the P0-11 reviewed-plan reader before display.
- Starting reassessment validates the expected current plan and profile version, then calls `transitionWorkflow` from PLAN_AVAILABLE to REASSESSMENT_PENDING inside `inDatasetTransaction`. The original plan remains immutable. Repeating the same unfinished start resumes intake without duplicating state records.
- Redirect to the existing intake UI; its submission producer creates the next profile version, appends its own profile/intake events and invokes Worker A's analysis action. No new version is fabricated merely by opening an edit form. A submitted update must return through analysis and review; incomplete/failed cycles retain the prior reviewed plan as previous.
- History navigation uses the shared link pattern. Historical plan pages use P0-11's plan presentation, explicitly labeled previous when appropriate.

## Risks / Trade-offs

P0-02/P0-04/P0-07/P0-11/P0-12 producers are in flight. Code against agreed APIs and test with synthetic records/local mocks; do not claim integrated flow D or archive before real producer wiring and full checks pass.

## Verification Plan

TDD for chronology, links, duplicate handling, cross-patient exclusion, immutable history, stale reassessment and repeated entry. Server tests for session dataset isolation. E2e checks direct historical URLs, mobile/desktop navigation, unfinished reassessment and two reviewed plan cycles after producer integration. Run the full definition-of-done checks and inline clinical/design/spec/security review.
