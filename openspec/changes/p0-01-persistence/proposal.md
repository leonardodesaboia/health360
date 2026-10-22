# P0-01 — Synthetic persistence and version boundaries

Status: planned; **no implementation completed**.

## Why

Establish PostgreSQL/Prisma persistence for core records with immutable profile/analysis/plan versions.

## What Changes

synthetic seeds only; stable IDs/foreign keys; review/analysis/profile/context version links; previous versions cannot be silently overwritten; no clinical data in logs.

## Capabilities

### New Capabilities

- `persistence`: Synthetic persistence and version boundaries.

### Modified Capabilities

None. This is a planned addition to the current foundation.

## Impact

future `src/server/db`, Prisma schema/migrations, contracts, `.env.example`, architecture.

## Dependencies

foundation; human selection of local DB environment.

## Out of scope

Unrelated MVP modules, real-patient use, autonomous clinical decisions and product section 19 exclusions. This proposal does not authorize execution until assigned.
