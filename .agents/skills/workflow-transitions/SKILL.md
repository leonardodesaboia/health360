---
name: workflow-transitions
description: How to safely add, remove, or change Health360 workflow statuses and transitions (NOT_STARTED through REASSESSMENT_PENDING) without bypassing analysis, clarification, or physician review. Use when editing src/features/workflow, status labels, StatusIndicator, USER_FLOWS.md, or any code that moves a patient between workflow states.
---

# Health360 workflow transitions

The workflow graph in `src/features/workflow/workflow.ts` is **administrative adjacency only**. `canTransition` says whether an edge exists. It does not prove that analysis ran, that evidence is valid, or that a physician reviewed anything. Read `USER_FLOWS.md` ("Administrative lifecycle") and `workflow.test.ts` before you change anything.

## Invariants (must hold after your change)

- The status union is exhaustive and matches the product's state list. Every status has a US English label in `statusLabels`. Statuses are never conveyed by color alone.
- No edge from any AI or analysis state straight to `PLAN_AVAILABLE`. A plan is published only after `MEDICAL_REVIEW_COMPLETED`.
- `CLARIFICATION_REQUIRED` returns through `ANALYSIS_PENDING`, never straight to review or plan.
- `ANALYSIS_FAILED` can only retry (`ANALYSIS_PENDING`) or return to intake. It never moves forward to review on its own.
- A profile update after a plan goes through `REASSESSMENT_PENDING`. The previous plan version is preserved, never overwritten.
- A UI click alone can never complete analysis or review. Transitions are executed by server services that check their preconditions atomically: actor and ownership, current profile, context, and analysis versions, evidence integrity, all proposals decided, and explicit finalization.

## Procedure for a change

1. **Justify the edge.** Write down why it's needed, which actor or service triggers it, and which server preconditions guard it. Link the OpenSpec change and requirement.
2. **Change everything together in one change:**
   - `workflowStatuses`, `transitions`, and `statusLabels` in `workflow.ts`;
   - the Zod enums that reuse `workflowStatuses` (contracts);
   - status UI (`StatusIndicator` and any status copy);
   - `USER_FLOWS.md`, including the state diagram and tables.
3. **Test exhaustively.**
   - Keep the test that checks _every_ (from, to) pair against an explicit expected-legal list written independently of the implementation map. Don't derive the expectations from `transitions` itself.
   - Add tests for each invariant above, for example that no path reaches `PLAN_AVAILABLE` without `MEDICAL_REVIEW_COMPLETED` (graph reachability).
   - Update the e2e flows affected (failure and retry, clarification, reassessment).
4. **Persisted data.** If states are already persisted (after task P0-01), describe the migration and compatibility for existing records in the change and PR description.
5. Run the `verify` skill. Apply the `clinical-safety` checklist to the guard conditions.

## Don't

- Don't add "skip", "force", or "admin override" edges for demo convenience. Use the demo reset (task P0-02) instead.
- Don't call `transition()` from client components to show progress.
- Don't treat a successful transition as proof of a clinical event.
