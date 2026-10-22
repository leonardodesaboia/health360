# OpenSpec per-task workflow

[docs/backlog/IMPLEMENTATION.md](../docs/backlog/IMPLEMENTATION.md) is the canonical ordered task index, including stable change IDs, acceptance criteria, required tests and lifecycle. This directory is not a second backlog.

- `specs/`: implemented baseline requirements, including [workflow-state](specs/workflow-state/spec.md), [demo-mode](specs/demo-mode/spec.md) and [foundation UI](specs/foundation/spec.md).
- `changes/<stable-id>/`: create only when picking up the corresponding authorized index entry; proposal references its stable index anchor, while design/tasks/spec deltas describe that implementation slice.
- `changes/archive/`: completed and reviewed changes only; link the archive from the index after successful promotion of specs.

OpenSpec is an exact development dependency. After `pnpm install --frozen-lockfile`:

```sh
pnpm exec openspec new change p0-03-intake-draft
pnpm exec openspec status --change p0-03-intake-draft
pnpm exec openspec instructions apply --change p0-03-intake-draft
pnpm exec openspec validate --all --strict --no-interactive
```

The example creates a change; run it only when that task is assigned and its dependencies are satisfied. No future MVP change is active in this foundation. Planning completeness is not implementation completion. Do not fabricate owner inputs, mark unchecked work done, bulk-archive future tasks or skip validation.

Decision/comparison: [ADR0002](../docs/adr/0002-spec-driven-workflow.md). Engineering specialist map: [WORKFLOW.md](../docs/ai/WORKFLOW.md).
