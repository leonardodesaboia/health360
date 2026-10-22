---
name: implement-task
description: End-to-end loop for implementing one Health360 backlog task or OpenSpec change: select and scope, plan, write tests first, implement, verify, self-review against the clinical, design, and spec checklists, update status, commit, and open a PR within the authorized publishing scope. Use when asked to implement, pick up, continue, or finish a backlog item (e.g. P0-03), an OpenSpec change, or "the next task" in Health360.
---

# Implement a Health360 task end to end

One task per session. Do only the assigned scope. The product context describes the whole MVP, but that doesn't authorize building all of it.

## 0. Identify the task source

- **OpenSpec change:** when `openspec/` exists and the task names a change (or the user asks for a new one), the change folder `openspec/changes/<change-id>/` (`proposal.md`, `design.md`, `tasks.md`, spec deltas) is the contract. Use the OpenSpec workflow: propose, apply, archive. The CLI is `openspec` (`openspec list`, `openspec show <id>`, `openspec validate <id>`).
- **Backlog task:** otherwise the task is an item in `docs/backlog/IMPLEMENTATION.md`, for example `P0-03`. If no ID was given, pick the earliest unfinished P0 task whose dependencies are complete, and state which one you picked.
- If the task depends on a human decision (medical criteria, provider choice, DB environment, secrets), stop and ask before building around it.

## 1. Scope and plan

1. Read `AGENTS.md`, `ARCHITECTURE.md`, the task (goal, dependencies, areas, acceptance criteria, required tests), and the relevant `docs/product/PRODUCT_CONTEXT.md` sections.
2. Load the recipes that apply:
   - `new-feature` (code structure), always;
   - `design-system` for any UI;
   - `clinical-safety` for anything clinical;
   - `ai-layer` for LLM work;
   - `workflow-transitions` for state changes.
3. Inspect the existing code and tests in the affected areas. Verify any changing library APIs against installed types, `node_modules/next/dist/docs/`, or Context7. Never trust memory for versions or APIs.
4. Write a short plan:
   - the acceptance criteria restated as checkable items;
   - the files to touch;
   - server and client boundaries;
   - the failure behavior;
   - the tests you will add;
   - what is explicitly out of scope.

   For an OpenSpec change, `tasks.md` is the plan. Update it rather than writing a separate one.

5. Work on a feature branch, never the default branch.

## 2. Test first, then implement

For each acceptance criterion:

1. Write a failing test (Vitest unit or integration; Playwright when a user flow becomes functional).
2. Run it and watch it fail for the right reason.
3. Implement the minimal code to pass.
4. Refactor while the tests stay green.

Cover the negative paths the task lists: unknown data, invalid input, illegal transitions, blocked AI results, stale versions, and unauthorized access where relevant. Never weaken a gate or fake success to get green.

Keep the change a thin vertical slice. Don't add unrequested dependencies, abstractions, or folders. If you add a dependency, check its current version, peers, and license first.

## 3. Verify

Run the `verify` skill (`pnpm verify`, `pnpm test:e2e`, `pnpm format:check`) and fix the root causes. For UI, do the manual responsive and keyboard checks.

## 4. Self-review before publishing

Review your own diff (`git diff <base>...HEAD`) against:

- **Spec conformance:** every acceptance criterion or spec scenario is implemented **and** has a test that would fail without the change, and nothing out of scope slipped in.
- **The clinical-safety checklist**, if the change touches clinical data, AI, review, plan, or timeline.
- **The design-system checklist**, if it touches UI.
- **General quality:** types, error handling, server-only boundaries, no secrets or PII in code or logs, no dead code.

If your harness offers dedicated review agents (in Claude Code: `spec-conformance-reviewer`, `clinical-safety-reviewer`, `design-consistency-reviewer`, plus ECC's `typescript-reviewer`, `react-reviewer`, `security-reviewer`) and your session rules allow delegation, use them. Otherwise apply the checklists yourself. Fix real findings and re-run `verify`.

## 5. Record status and docs

- **Backlog:** mark the task done in `docs/backlog/IMPLEMENTATION.md` with brief evidence (tests added, commands passed, PR link once it exists) and any follow-ups.
- **OpenSpec:** tick the completed items in `tasks.md`, then run `openspec validate <id>`. Archive the change only after it is merged or the user approves archiving.
- Update the canonical docs your change affects (see `new-feature` §6).

## 6. Commit and publish (within scope)

- Use conventional commits (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`), focused and logically split.
- Push and open a PR **only** if the user or project workflow authorizes publishing. The PR body includes:
  - the task or change ID with a link;
  - a summary;
  - the acceptance criteria with the tests that cover each;
  - verification output excerpts;
  - risks, limitations, and the clinical-owner decisions still required.
- Never merge your own PR unless explicitly told to. Never force-push shared branches.

## 7. Final report

State:

- what was implemented, with paths;
- the exact verification results;
- what was not verified;
- deviations from the task;
- open questions.

Be honest about limits. A green test suite is not clinical validation.
