## Context

Shared patient contracts and datasetRepository are authoritative. getDemoSession supplies datasetId, caseId and patientId; a demo session scopes synthetic records and is not real physician authentication. The landed P0-07 producer drives the positive browser test through its real evaluator, validation and persistence service with MockProvider; direct contract fixtures remain test-only negative controls.

## Goals / Non-Goals

Deliver the read-only P0-09 queue and workspace. Do not create analyses, reviews, plans, clinical rules or authentication.

## Decisions

Server-only src/server/clinical-review/reader.ts loads records exclusively through datasetRepository after resolving the demo session. A pure src/features/clinical-review/reader.ts joins exact analysis/profile/context versions, filters by the session patient, chooses current analysis versions for the queue, and detects stale profile/context/analysis versions. Workspace IDs encode analysis identity plus version; existing persisted MedicalReview IDs also resolve their exact analysis reference. Rich rule/source metadata is shown only when it matches the exact stored context/source versions. Unknown IDs use Next.js notFound with noindex and no patient data. With the existing loading boundary, Next.js may already have streamed HTTP 200 before resolving a missing record; tests assert the not-found boundary and no disclosure rather than a static-route status code. Missing session yields an empty queue. Routes remain dynamic and reuse existing tokens and surfaces. Desktop queue uses a semantic table, mobile uses labeled list entries. Workspace uses two columns with native keyboard-accessible disclosures. Evidence URLs are restricted to http(s); unavailable sources are explicitly identified as placeholders.

## Risks / Trade-offs

The merged demo-session and workflow APIs provide the integration boundary. Reads reuse the shared database pool and run inside inDatasetTransaction; getWorkflowStatus acquires the shared patient lock before versioned record reads. The reader never treats a schema-valid record as medically approved. No fallback to production fixtures is permitted. The current exact profile is shown alongside stale warnings when newer data exists.

## Test mapping

Unit tests cover latest queue selection, actual timestamps, unknown IDs, cross-patient access, stale versions, exact evidence references and unknown values. E2E covers no-session queue, inaccessible IDs, responsive overflow and keyboard navigation; persisted fixtures use the real demo store and its seeded clinicalContext.id. Test fixture setup/cleanup has a separate 60-second budget; browser bodies retain the default 30-second limit.
