# Synthetic persistence and version boundaries

## Why

[P0-01](../../../docs/backlog/IMPLEMENTATION.md#p0-01) needs durable synthetic records before the demo can share state. Foundation contracts satisfy the dependency; parallel consumers use those contracts before UI work merges.

## What Changes

- Add Prisma/PostgreSQL 17 migrations, dataset-scoped core records and append-only versions/timeline events.
- Add server-only repositories, reproducible synthetic seed and isolated integration tests.
- Preserve unknowns and provenance. No clinical rules, authentication or publication services.

## Capabilities

### New Capabilities

- `synthetic-persistence`: validated, scoped storage with immutable versions and referential integrity.

### Modified Capabilities

None. Reference screens keep their fixtures until P0-02.

## Impact

Prisma dependencies, src/server/db, database commands, environment example, architecture and only the P0-01 backlog entry. Tests cover migrations, seeds, unknowns, uniqueness, foreign keys, rollback and immutability. No real data, deployment or external APIs.
