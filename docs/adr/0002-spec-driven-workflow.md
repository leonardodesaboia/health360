# ADR 0002 — Hybrid ordered index and per-task specifications

Status: adopted, 2026-10-22. Supersedes the initial pre-created-change backlog layout.

## Decision

**OpenSpec 1.14.3 is ADOPTED as the per-task spec workflow**, pinned as the exact
development dependency `@fission-ai/openspec`. Agents use `pnpm exec openspec`.
Core initialization selected `--tools none`; harness integrations belong to the
separate Claude and Codex tooling workers.

[docs/backlog/IMPLEMENTATION.md](../backlog/IMPLEMENTATION.md) remains the sole
canonical **ordered index**: stable task/change IDs, dependencies, acceptance,
required tests and completion links. At pickup create or resume the corresponding
`openspec/changes/<stable-id>/` proposal, design, task checklist and spec deltas.
The proposal links the index entry; do not duplicate long acceptance criteria or
maintain a second order/status list. After implementation, verification and review,
archive the change and mark the index entry done with archive/test/PR links.

`openspec/specs/` contains observable implemented behavior. The prepared future
MVP drafts were all unchecked and unimplemented; their substance is preserved in
the index, and their folders are created only when work is picked up. Planning
artifact completeness never proves implementation or clinical validity.

## Alternatives and supporting plugins

| Tool                         | Decision                                                               | Reason                                                                                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| OpenSpec                     | Adopt per-task proposals/spec deltas/tasks and archive lifecycle       | Fits Node/pnpm, keeps change evidence reviewable and supports multiple coding agents.                                                                              |
| ECC / everything-claude-code | Adopt selected harness-plugin recipes/review lanes                     | Complements specification execution; spec-miner can extract existing behavior, but neither plugin advice nor review supplies clinical criteria or another backlog. |
| superpowers                  | Adopt harness-plugin brainstorming/planning/TDD/verification practices | Applies execution discipline to the same change artifacts; avoid duplicated plans and automatic delegation outside session policy.                                 |
| GitHub Spec Kit              | Considered, not adopted                                                | Its spec/plan/task workflow is viable, but installing a second framework would duplicate planning sources and add Python/uv setup to this Node foundation.         |

Harness-specific enablement belongs in `docs/ai/claude-code.md` and
`docs/ai/codex.md`, delivered by the other workers. [WORKFLOW.md](../ai/WORKFLOW.md)
records researched primary sources, verified marketplace commands, specialist
mapping and clinical-scope limits. [TOOLING.md](../ai/TOOLING.md) is only an index.

## Safeguards

Dependency/medical-owner checks remain mandatory even if CLI planning status says
ready. All prototype records stay synthetic, unknowns stay explicit, evidence must
be supplied/versioned and publication requires physician review. Do not archive an
unimplemented change, force promotion, or use foundation smoke to complete a future
clinical task. Runtime and publishing authorization come from the active task.
