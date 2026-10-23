## Context

Shared patient contracts and datasetRepository are authoritative. getDemoSession supplies datasetId, caseId and patientId; a demo session scopes synthetic records and is not real physician authentication. Analysis producers remain in flight; contract-parsed fixtures are tests only.

## Goals / Non-Goals

Deliver the read-only P0-09 queue and workspace. Do not create analyses, reviews, plans, clinical rules or authentication.

## Decisions

Server-only src/server/clinical-review/reader.ts loads records exclusively through datasetRepository after resolving the demo session. A pure src/features/clinical-review/reader.ts joins exact analysis/profile/context versions, filters by the session patient, chooses current analysis versions for the queue, and detects stale profile/context/analysis versions. Workspace IDs encode analysis identity plus version, not an invented persisted MedicalReview. Unknown IDs return 404. Missing session yields an empty queue. Routes remain dynamic and reuse existing tokens and surfaces. Desktop queue uses a semantic table, mobile uses labeled list entries. Workspace uses two columns with native keyboard-accessible disclosures. Evidence URLs are restricted to http(s); unavailable sources are explicitly identified as placeholders.

## Risks / Trade-offs

Upstream demo-session and workflow persistence APIs must land before integration verification. The reader never treats a schema-valid record as medically approved. No fallback to production fixtures is permitted. The current exact profile is shown alongside stale warnings when newer data exists.

## Test mapping

Unit tests cover latest queue selection, actual timestamps, unknown IDs, cross-patient access, stale versions, exact evidence references and unknown values. E2E covers no-session queue, inaccessible IDs, responsive overflow and keyboard navigation; persisted fixture flow will use the demo session producer once available.
