## ADDED Requirements

### Requirement: Dataset-scoped physician queue

The server SHALL list only the current demo dataset's patient analyses with actual analysis timestamps and versioned workspace links.

#### Scenario: No demo session

- **WHEN** the physician opens the queue without a demo session
- **THEN** no patient records are disclosed and a selection prompt is shown

#### Scenario: Current analysis

- **WHEN** the dataset contains multiple analysis versions
- **THEN** the queue displays the newest analysis for the session patient with its stored creation time

### Requirement: Versioned preliminary reader

The workspace SHALL expose the referenced profile, examinations, proposal category, rationale, criteria, versioned evidence, unknown data and uncertainty with demonstrative and preliminary labels.

#### Scenario: Foreign or invalid identifier

- **WHEN** an identifier is absent from the scoped dataset or belongs to another patient
- **THEN** the workspace returns no patient information

#### Scenario: Stale analysis

- **WHEN** a newer profile, context or analysis exists
- **THEN** the reader warns that the analysis is stale

#### Scenario: Unknown data and evidence

- **WHEN** a profile fact or evidence reference is unavailable
- **THEN** it remains explicitly unknown or placeholder and is never presented as confirmed

#### Scenario: Responsive keyboard reader

- **WHEN** the workspace is read on mobile or desktop with a keyboard
- **THEN** context and proposal disclosures remain accessible without horizontal page overflow
