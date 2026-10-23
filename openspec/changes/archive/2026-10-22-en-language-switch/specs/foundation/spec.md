## MODIFIED Requirements

### Requirement: Synthetic reference environments

The application SHALL render the patient home, read-only intake, unavailable-plan page,
physician queue, known synthetic review workspace and component showcase with US English
interface text, an HTML document language of `en`, en-US date and number formatting,
and explicit demonstration labeling.

#### Scenario: Navigate the synthetic reference screens

- **WHEN** a user follows patient/doctor navigation or opens the showcase
- **THEN** the requested reference screen SHALL render without exposing real data or implying clinical validation
- **AND** role switching SHALL change navigation only, without granting authorization

#### Scenario: Unknown review identifier

- **WHEN** an identifier other than the prepared synthetic review is requested
- **THEN** the application SHALL return HTTP 404 and an English not-found page

#### Scenario: English metadata and display formatting

- **WHEN** a user opens a reference screen that displays dates or numbers
- **THEN** the document language SHALL be `en` and display formatting SHALL use en-US
- **AND** stored ISO dates and entity identifiers SHALL remain unchanged
