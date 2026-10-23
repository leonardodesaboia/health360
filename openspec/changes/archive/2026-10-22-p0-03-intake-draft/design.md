## Context

The foundation provides RHF 7, Zod 4, shared Input/Button/Surface and patient contracts. The wave authorizes a local draft adapter while persistence/session work proceeds in parallel.

## Goals / Non-Goals

Collect synthetic age, CRC-relevant symptoms and personal/family history confirmed by Worker B via the orchestrator. Preserve unanswered, declared negative and unknown as different values. Do not collect names or identifiers. No clinical decisions, DB access, workflow transitions or completion claim.

## Decisions

- Pure configuration/schema in `src/features/health-intake/contracts.ts`; step definitions own their field lists. Conditional history details are required only for a declared history.
- RHF client island composes existing controls; errors connect to inputs and focus the first invalid field. Back does not validate. Next validates only current step.
- Draft envelope includes schema version, scope, revision, step and timestamp. `IntakeDraftRepository` isolates browser storage. Validate loaded data, reject stale revisions, never overwrite a corrupt draft, and show failures with a retry action. Saving is explicit; navigation saves before advancing.
- Browser storage is synthetic demonstration storage, isolated by a fixed demo scope until P0-02 provides trusted selection. It is not clinical persistence or authorization.

## Risks / Trade-offs

Browser storage cannot provide cross-device/session sharing or server authorization. Display this limit. A later Prisma adapter must revalidate scope, identity and revision server-side.

## Test Mapping

Schema tests cover age bounds and conditional unknown/negative handling. Repository tests cover restore, malformed storage, stale writes, storage failures and scope isolation. Playwright covers inline validation/focus, conditional fields, back/next, save/reload and mobile overflow. Existing foundation intake title assertion is updated to the functional route title.
