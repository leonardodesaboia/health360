---
name: implement-task
description: End-to-end loop for implementing one Health360 backlog task (e.g. P0-03) from the ordered index in docs/backlog/IMPLEMENTATION.md through its OpenSpec change: pick up or resume the change, plan in its design/tasks, write tests first, implement, verify, self-review against the spec, clinical, and design checklists, record evidence, archive, and open a PR within the authorized publishing scope. Use when asked to implement, pick up, continue, or finish a backlog task, an OpenSpec change, or "the next task" in Health360.
---

# Implement a Health360 backlog task end to end

One task per session. Do only the assigned scope. The product context describes the whole MVP, but that doesn't authorize building all of it.

## 0. Select the task and pick up its change

- **The ordered index is `docs/backlog/IMPLEMENTATION.md`.** Each entry has an anchor (`#p0-03`), a stable OpenSpec change ID (`p0-03-intake-draft`), a status, a goal, dependencies, areas, acceptance criteria, and required tests. It is the only backlog. Follow its "OpenSpec task lifecycle" section and `AGENTS.md` "Pick up a task". Where this skill differs from them, they win.
- If no task was named, pick the first authorized **planned** P0 entry (then P1) whose dependencies are done and whose external-owner inputs exist. Say which one you picked.
- Dependencies and owner inputs aren't enforced by the CLI. Check them yourself. If a task needs a human input (medical criteria, evidence IDs, expected outcomes, provider choice, DB environment, secrets), stop and ask. Never fabricate it.
- Use the locked CLI: `pnpm exec openspec ...` (devDependency, 1.14.3). The generated `openspec-*` skills write bare `openspec ...`. Run those commands as `pnpm exec openspec ...` too, because a global `openspec` may be a different version.
- **Pick up the change.**
  1. If `openspec/changes/<stable-id>/` exists, resume it; never create a duplicate. Otherwise run `pnpm exec openspec new change <stable-id>`.
  2. Write `proposal.md` linking the index anchor (for example `../../../docs/backlog/IMPLEMENTATION.md#p0-03`). State the scope and the exclusions.
  3. Derive the spec deltas, `design.md`, and `tasks.md` from the entry. Reference its acceptance criteria rather than copying long lists.
  4. Mark the index entry **in progress** with a link to the change.

  ```sh
  pnpm exec openspec new change <stable-id>
  pnpm exec openspec status --change <stable-id>
  pnpm exec openspec instructions apply --change <stable-id> --json   # actual checkbox progress
  pnpm exec openspec validate --all --strict --no-interactive
  ```

- `status --json` `isComplete: true` means only that the planning artifacts exist, not that anything is implemented. Judge progress by the unchecked boxes in `tasks.md`.

## 1. Scope and plan

1. Read `AGENTS.md`, `ARCHITECTURE.md`, `docs/ai/WORKFLOW.md`, the index entry and its change (proposal → specs → design → tasks), and the relevant `docs/product/PRODUCT_CONTEXT.md` sections.
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

## 5. Record status, archive, docs

- In `tasks.md`, tick **only** the items you actually completed, and record evidence: tests added, real command results, the review performed, and follow-ups. Never tick boxes based on foundation smoke tests or planning completeness.
- Run `pnpm exec openspec validate --all --strict --no-interactive`.
- After all assigned work, verification, and review pass:
  1. Run `pnpm exec openspec archive <stable-id>` (or the `openspec-archive-change` skill). Inspect the diff, and never force or skip checks. Archiving promotes the deltas into the baseline specs.
  2. Mark the index entry **done**, with the archive, verification, and PR links.
- Never archive an unimplemented plan, and never bulk-archive.
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
