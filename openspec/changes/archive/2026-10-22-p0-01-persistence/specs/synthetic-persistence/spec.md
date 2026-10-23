## ADDED Requirements

### Requirement: Validated synthetic records

Persistence SHALL validate core records, preserve unknown values and provenance, and scope every record to an explicit synthetic dataset.

#### Scenario: Seed and read

- **WHEN** the seed runs twice
- **THEN** it SHALL retain one equivalent dataset without mutating source fixtures
- **AND** unknown clinical facts SHALL remain null

### Requirement: Immutable linked versions

Historical profiles, contexts, analyses, reviews, plans and timeline events SHALL be append-only with unique version identities and database-enforced ownership/version references.

#### Scenario: Invalid version write

- **WHEN** a write duplicates a version, modifies history or references a missing parent or another dataset
- **THEN** persistence SHALL reject it and preserve previous data

#### Scenario: Failed transaction

- **WHEN** any operation in a repository transaction fails
- **THEN** all writes in that transaction SHALL roll back

### Requirement: Dataset isolation

Repository reads and explicit dataset deletion SHALL affect only the selected dataset.

#### Scenario: Isolated deletion

- **WHEN** one dataset is deleted
- **THEN** its dependent records SHALL be removed atomically
- **AND** another dataset SHALL remain unchanged
