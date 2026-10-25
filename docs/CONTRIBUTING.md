# Contributing with humans and AI agents

Read [AGENTS.md](../AGENTS.md) first: it is the canonical harness-neutral policy,
including the OpenSpec pickup → plan → TDD → verify → review → archive lifecycle.
Use the [ordered index](backlog/IMPLEMENTATION.md) for task order/dependencies and
[STATUS](STATUS.md) for the dated inventory of landed code and incomplete flows.
Do only the authorized task. All data is synthetic; tests and demo review never
establish clinical validity.

## Branches and pull requests

`main` is protected. Use a focused feature branch and a PR targeting main. The
required `verify` check must be green, including for administrators. The recorded
policy has zero required approvals, but engineering review is still expected.
The human owner merges; agents must not merge or bypass protection.

Use conventional commits and the owner's GitHub noreply email
`135280840+leonardodesaboia@users.noreply.github.com` for this repository owner;
other contributors use their own GitHub noreply address. GitHub blocks pushes
exposing the owner's personal email. Check author identity before committing.
In linked worktrees use worktree-scoped settings or a one-command `git -c user.email=...`;
do not mutate shared repository configuration incidentally.

PR descriptions explain the problem, resulting behavior, linked task/change,
actual checks and remaining limitations. Publish only within active task scope.
Never force-push shared history, commit `.env` or real patient data, or modify
another agent's private local settings.

## Ownership and contract-first work

Before editing, inspect `git status`, fetch origin/main and check
`gh pr list --state open` plus the assigned change's proposal/design/tasks. Confirm
ownership and scope of dependent work with the active coordinator. An open producer
PR is not a delivered dependency even when its local checklist is complete.

Agree file/module lanes before concurrent changes. Typical responsibilities are
session/storage, intake/profile, deterministic rules/AI analysis, physician
review/clarification, reviewed plans/history and deployment/tooling. Shared contracts
in `src/features/patients/contracts.ts` and `src/server/db/records.ts` require
coordinated ownership. Agree API signatures, nullable fields, enum migrations and
audit references before implementing consumers. Use [ADR0005](adr/0005-integration-contracts.md).
Do not copy contexts, invent alternate workflow writers or weaken gates to
accommodate an unfinished producer.

ARCHITECTURE.md and the implementation index are shared files. Keep edits narrow,
preserve other workers' changes, and rebase on current main immediately before
pushing. Resolve conflicts against final code and the owning task, then rerun
affected checks. Coordinate rather than overwrite another lane's work. Never
archive another owner's unfinished change or mark open implementation work done.

## Reviews and verification

Follow the checks/review recipes in [AGENTS.md](../AGENTS.md) and
[the execution workflow](ai/WORKFLOW.md); do not create a second pickup checklist.
Review observable behavior, failure paths, dataset boundaries, unknown handling,
version freshness, provenance and finalized-review publication gates. UI work
needs design consistency plus mobile/desktop and keyboard inspection. AI work
must preserve minimized input, fail-closed checks and no private reasoning retention.
Engineering reviewers are not medical reviewers.

Record exact checks, counts and skipped/unverified work. Use deterministic mock
providers for CI/offline demos. Live connectivity and VPS operation are separate
checks, never inferred from mocks or a local build. Follow active session
review/delegation rules; when a separate reviewer is unavailable, review guidance
inline and say so. Address comments before completion; leave merging to the owner.
