# Design

A patient's immutable `status` is the initial state. The latest append-only WorkflowTransition by monotonically increasing per-patient version is authoritative thereafter. Dataset/patient composite foreign keys isolate histories; a unique version key and SQL mutation trigger preserve them.

`getWorkflowStatus(db, datasetId, patientId)` returns the current WorkflowStatus or rejects a missing patient. `transitionWorkflow(db, datasetId, {patientId, expectedFrom, to, actor, reason?, refs?})` validates input, serializes by advisory transaction lock on dataset/patient, checks expectedFrom against current storage, validates the existing graph, appends server ID/time/version plus audit metadata, and returns the destination status. Root PrismaClient calls receive an internal transaction; an existing TransactionClient lets callers commit domain records and state together. A failed caller transaction rolls back its state transition too.

Actor is patient, system or demo-physician. Refs optionally identify profileVersion, analysisId, reviewId and planId. These are trace metadata, not medical approval or authorization. Calling services must validate identity, ownership, referenced record freshness, evidence and review/publication gates before invoking this internal API. There is no route handler or Server Action.

Existing snapshots remain unchanged. Migration adds only a new table; deploy before consumers, rollback consumers before removing the table. No data backfill is necessary. Unit tests validate audit schemas; PostgreSQL tests prove initial fallback, transitions, metadata, stale/illegal rejection, dataset isolation, rollback, concurrency and immutability. Existing exhaustive graph and desktop/mobile smoke tests remain unchanged.

## Attempt identity and ABA protection

Input expectedRefs is an optional partial comparison against the latest transition refs (profileVersion, analysisId, reviewId, planId). A supplied field must match exactly, including rejecting absent stored values. Status and refs comparisons execute under the same advisory transaction lock. Both mismatches throw exported StaleStateError. Expected refs are a condition, not persisted audit metadata; refs supplies the new record's audit context.

getWorkflowState returns {status,lastTransition} and holds that same lock for the remainder of a caller transaction. A root-client read creates a bounded transaction. getWorkflowStatus delegates to that consistent read. Tests cover failure/retry returning to ANALYSIS_PENDING with a new analysis ID, rejection/rollback of a superseded writer, valid new-attempt completion and explicit lock ownership.
