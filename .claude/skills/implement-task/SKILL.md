---
name: implement-task
description: End-to-end loop for implementing one Health360 OpenSpec change (the backlog, e.g. P0-03 / p0-03-intake-draft): check dependencies, plan in the change's design/tasks, write tests first, implement, verify, self-review against the spec, clinical, and design checklists, record evidence in tasks.md, commit, and open a PR within the authorized publishing scope. Use when asked to implement, pick up, continue, or finish a backlog item, an OpenSpec change, or "the next task" in Health360.
---

# Implement a Health360 OpenSpec change end to end

One change per session. Do only the assigned scope. The product context describes the whole MVP, but that doesn't authorize building all of it.

## 0. Select the change

- **OpenSpec is the only backlog.** `openspec/README.md` lists the P0 and P1 changes in dependency order. Each `openspec/changes/<id>/` holds `proposal.md`, `specs/` (requirements and scenarios), `design.md`, `tasks.md`, and an "Evidence" section, and together they are the contract. `docs/backlog/IMPLEMENTATION.md` is only a redirect.
- Use the pinned CLI (no global install needed):

  ```sh
  npx -y @fission-ai/openspec@1.14.3 list
  npx -y @fission-ai/openspec@1.14.3 instructions apply --change <id> --json   # implementation checkbox progress
  npx -y @fission-ai/openspec@1.14.3 validate --all --strict --no-interactive
  ```

  If a bare `openspec` is on PATH, check that `openspec --version` reports 1.14.3 before using it.

- If no change was named, pick the first P0 change (then P1) whose dependencies are **implemented**, and say which one you picked.
- **`status --json` reporting `isComplete: true` means only that the planning artifacts exist**, not that anything is implemented. Judge progress by the unchecked boxes in `tasks.md`.
- Dependencies aren't enforced by the CLI. Check them yourself. If a change needs a human input (medical criteria, evidence IDs, expected outcomes, provider choice, DB environment, secrets), stop and ask. Never fabricate it.
- A new change (not in the README) starts with the `openspec-propose` workflow, and only when the user asks for one.

## 1. Scope and plan

1. Read `AGENTS.md`, `ARCHITECTURE.md`, `docs/ai/WORKFLOW.md`, the change (proposal → specs → design → tasks), and the relevant `docs/product/PRODUCT_CONTEXT.md` sections.
2. Load the recipes that apply:
   - `new-feature` (code structure), always;
   - `design-system` for any UI;
   - `clinical-safety` for anything clinical;
   - `ai-layer` for LLM work;
   - `workflow-transitions` for state changes.
3. Inspect the existing code and tests in the affected areas. Verify any changing library APIs against installed types, `node_modules/next/dist/docs/`, or Context7. Never trust memory for versions or APIs.
4. Plan **inside the change**. Refine `design.md` with:
   - concrete boundaries and file paths;
   - server and client responsibilities;
   - failure behavior;
   - out-of-scope items.

   Then map every spec scenario to the test that will prove it, and refine `tasks.md` where needed. Don't keep a parallel plan file (superpowers or ECC planners included). Point them at these artifacts.

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

Run the `verify` skill (`pnpm verify`, `pnpm test:e2e`, `pnpm format:check`, strict OpenSpec validation) and fix the root causes. For UI, do the manual responsive and keyboard checks.

## 4. Self-review before publishing

Review your own diff (`git diff <base>...HEAD`) against:

- **Spec conformance:** every acceptance criterion or spec scenario is implemented **and** has a test that would fail without the change, and nothing out of scope slipped in.
- **The clinical-safety checklist**, if the change touches clinical data, AI, review, plan, or timeline.
- **The design-system checklist**, if it touches UI.
- **General quality:** types, error handling, server-only boundaries, no secrets or PII in code or logs, no dead code.

If your harness offers dedicated review agents (in Claude Code: `spec-conformance-reviewer`, `clinical-safety-reviewer`, `design-consistency-reviewer`, plus ECC's `typescript-reviewer`, `react-reviewer`, `security-reviewer`) and your session rules allow delegation, use them. Otherwise apply the checklists yourself. Fix real findings and re-run `verify`.

## 5. Record status and docs

- Tick **only** the `tasks.md` items you actually completed. Replace the change's "Evidence" section with:
  - the tests added;
  - the real command results;
  - the review performed;
  - the PR link once it exists;
  - any follow-ups.
- Never tick boxes based on foundation smoke tests or planning completeness.
- Run `npx -y @fission-ai/openspec@1.14.3 validate --all --strict --no-interactive`.
- Archive (`openspec-archive-change`) only after the implementation is merged, reviewed, and every required task is done. Archiving promotes the specs to the baseline. Never use force or skip-validation flags, and never bulk-archive.
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
