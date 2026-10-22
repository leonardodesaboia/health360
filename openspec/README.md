# Canonical implementation backlog

OpenSpec is the only implementation backlog. Product context remains [PRODUCT_CONTEXT.md](../docs/product/PRODUCT_CONTEXT.md); it is background, not a second task tracker. All 18 changes below are **planned and unimplemented**. Requirements, design decisions, task checkboxes and execution evidence live inside each change.

Current implemented behavior lives in [foundation specs](specs/foundation/spec.md). Future requirements stay under changes/ until implemented, reviewed and archived. Do not copy future specs into the implemented baseline early.

## Execution order

Choose the first authorized change whose dependencies are satisfied; P0 precedes P1. Human medical inputs and provider/database decisions listed in dependencies remain required.

| Priority / ID | Change                                                                                             | Canonical checklist                                 | Dependencies                                                                  |
| ------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| P0-01         | [Synthetic persistence and version boundaries](changes/p0-01-persistence/proposal.md)              | [Tasks](changes/p0-01-persistence/tasks.md)         | foundation; human selection of local DB environment.                          |
| P0-02         | [Demonstration session and reset](changes/p0-02-demo-session/proposal.md)                          | [Tasks](changes/p0-02-demo-session/tasks.md)        | P0-01.                                                                        |
| P0-03         | [Guided intake, first slice](changes/p0-03-intake-draft/proposal.md)                               | [Tasks](changes/p0-03-intake-draft/tasks.md)        | P0-01, P0-02; approved minimal scenario fields.                               |
| P0-04         | [Intake completion and clinical profile](changes/p0-04-clinical-profile/proposal.md)               | [Tasks](changes/p0-04-clinical-profile/tasks.md)    | P0-03.                                                                        |
| P0-05         | [Restricted clinical context and deterministic checks](changes/p0-05-clinical-context/proposal.md) | [Tasks](changes/p0-05-clinical-context/tasks.md)    | P0-04; owner-supplied criteria, evidence IDs and expected synthetic outcomes. |
| P0-06         | [Replaceable server LLM adapter](changes/p0-06-llm-adapter/proposal.md)                            | [Tasks](changes/p0-06-llm-adapter/tasks.md)         | P0-05; user-selected provider and separately supplied secret.                 |
| P0-07         | [Validation and analysis orchestration](changes/p0-07-analysis-validation/proposal.md)             | [Tasks](changes/p0-07-analysis-validation/tasks.md) | P0-06.                                                                        |
| P0-08         | [Do Not Test slice](changes/p0-08-do-not-test/proposal.md)                                         | [Tasks](changes/p0-08-do-not-test/tasks.md)         | P0-05, P0-07.                                                                 |
| P0-09         | [Persisted physician queue and proposal reader](changes/p0-09-review-reader/proposal.md)           | [Tasks](changes/p0-09-review-reader/tasks.md)       | P0-07, P0-08.                                                                 |
| P0-10         | [Physician decisions and finalization](changes/p0-10-physician-decisions/proposal.md)              | [Tasks](changes/p0-10-physician-decisions/tasks.md) | P0-09.                                                                        |
| P0-11         | [Reviewed preventive plan](changes/p0-11-reviewed-plan/proposal.md)                                | [Tasks](changes/p0-11-reviewed-plan/tasks.md)       | P0-10.                                                                        |
| P0-12         | [Deterministic clarification loop](changes/p0-12-clarification/proposal.md)                        | [Tasks](changes/p0-12-clarification/tasks.md)       | P0-07, P0-10.                                                                 |
| P0-13         | [Longitudinal history and reassessment](changes/p0-13-reassessment/proposal.md)                    | [Tasks](changes/p0-13-reassessment/tasks.md)        | P0-11, P0-12.                                                                 |
| P0-14         | [Prepared demonstration and complete acceptance suite](changes/p0-14-demo-acceptance/proposal.md)  | [Tasks](changes/p0-14-demo-acceptance/tasks.md)     | P0-01 through P0-13.                                                          |
| P1-01         | [AI-assisted question phrasing](changes/p1-01-question-phrasing/proposal.md)                       | [Tasks](changes/p1-01-question-phrasing/tasks.md)   | P0-12, P0-06.                                                                 |
| P1-02         | [Compare plan versions](changes/p1-02-plan-comparison/proposal.md)                                 | [Tasks](changes/p1-02-plan-comparison/tasks.md)     | P0-13.                                                                        |
| P1-03         | [Summaries of changes](changes/p1-03-change-summaries/proposal.md)                                 | [Tasks](changes/p1-03-change-summaries/tasks.md)    | P1-02, P0-06, P0-07.                                                          |
| P1-04         | [Demonstration usability improvements](changes/p1-04-demo-usability/proposal.md)                   | [Tasks](changes/p1-04-demo-usability/tasks.md)      | P0-14; concrete feedback selected by owner.                                   |

## Workflow

Read proposal.md → specs/ → design.md → tasks.md. Use spec → plan → TDD → verify → review; refine the existing design/task artifacts rather than creating a parallel plan. See [workflow adoption and specialist map](../docs/ai/WORKFLOW.md) and [AGENTS.md](../AGENTS.md).

CLI (locked dev dependency; run `pnpm install --frozen-lockfile` first, no global installation required):

```sh
pnpm exec openspec list
pnpm exec openspec status --change p0-01-persistence
pnpm exec openspec instructions apply --change p0-01-persistence
pnpm exec openspec validate --all --strict --no-interactive
```

A complete set of planning artifacts does not mean implementation tasks are complete. Archive only after actual implementation, passing tests and review; archive updates the baseline specs.

### Execution safeguards

- The pinned CLI's `status --json` can report `isComplete: true` when proposal/spec/design/task artifacts exist. That is **planning completeness**, not delivered MVP functionality. Inspect `instructions apply --change <id> --json` and unchecked tasks for implementation progress.
- Dependency declarations are human/agent preconditions, not automatically enforced scheduling. Do not start a blocked dependency or fabricate medical-owner inputs because the CLI says artifacts are ready.
- Assignment of one change does not authorize implementing every planned change. Review the existing design and scenarios before changing code; refine them when an unresolved API or medical input becomes concrete.
- Never check future tasks as completed based on foundation smoke tests. Keep test/review evidence for the selected implementation and archive only when all its required work is done.
- Do not use force/skip-validation flags or bulk archive to turn plans into implemented baseline specs. Check stale clinical versions, physician-review gates and failure scenarios before publishing clinical output.

## End-to-end and deferred scope

[Flows A–E](changes/p0-14-demo-acceptance/specs/end-to-end-flows/spec.md) are canonical future test specifications, not executable foundation tests. Current smoke lives in tests/e2e/foundation.spec.ts.

P2 commercial integrations/advanced intelligence need fresh scope. Product section 19 remains excluded: proprietary models/training, predictive ML, knowledge graphs, multiagent orchestration, complex RAG/vector DB, native mobile, real lab/hospital integration, telemedicine, payments, scheduling, OCR, open medical chatbot, marketplace, enterprise dashboards, wearables and real-patient use.
