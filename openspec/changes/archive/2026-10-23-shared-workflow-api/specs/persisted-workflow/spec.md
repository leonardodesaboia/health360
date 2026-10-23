## Purpose

Specify authoritative synthetic-patient administrative state with append-only, transactionally consistent workflow audit history.

## ADDED Requirements

### Requirement: Scoped authoritative status

Status reads SHALL use the latest transition version for a dataset/patient or its immutable initial patient status when no transitions exist. Missing patients SHALL be rejected.

#### Scenario: Read after transition

- **WHEN** a valid transition commits
- **THEN** subsequent reads SHALL return its destination without modifying the patient snapshot
- **AND** another dataset's state SHALL remain unchanged

### Requirement: Auditable compare-and-transition

Writes SHALL validate expectedFrom, the existing legal graph and a required actor, and persist server identity/time/version plus optional reason and references. Calls SHALL work within an existing transaction or create one for a root client.

#### Scenario: Concurrent or invalid write

- **WHEN** writers use the same expectedFrom or an illegal destination
- **THEN** at most one valid transition SHALL commit and stale or illegal writes SHALL leave history unchanged

#### Scenario: Audit and rollback

- **WHEN** a transition commits
- **THEN** its actor and supplied reason/references SHALL be preserved in immutable history
- **AND** failure of a containing transaction SHALL roll back the transition

### Requirement: Attempt-aware compare-and-set

Optional expectedRefs SHALL compare every supplied field against the latest transition refs under the same patient lock. A status or reference mismatch SHALL throw StaleStateError. getWorkflowState SHALL return status and the latest transition or null, holding the patient lock for an existing caller transaction.

#### Scenario: Superseded analysis returns to the same status

- **WHEN** a retry restores ANALYSIS_PENDING for a new analysis ID and an older attempt supplies its expected analysis ID
- **THEN** the old attempt SHALL be rejected even though expectedFrom still matches
- **AND** its enclosing transaction's record writes SHALL roll back

#### Scenario: Locked state read

- **WHEN** getWorkflowState reads inside a caller transaction
- **THEN** another transaction SHALL NOT acquire the same patient advisory lock until that transaction ends
