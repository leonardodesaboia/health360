## Context

The physician reader identifies exact analyses. DatasetRepository is append-only. The upstream workflow service provides current state and serialized legal transitions. Demo sessions are navigation scope, not real physician authentication. The reviewer is always server-assigned demo-physician.

## Goals / Non-Goals

Persist review decisions and finalize explicitly. Never implement plan construction (the landed owner service is called atomically), alter an analysis, invent clinical rules, or grant real-world physician authority.

## Decisions

Pure feature validation parses the shared MedicalReview decision shape and enforces trimmed reasons for MODIFY/REJECT, revised text for MODIFY, exact one decision per proposal, current versions, preliminary/nonempty analysis and valid evidence/rule references. The server assigns timestamps and reviewer identity; forged client audit fields are rejected. A stable random review ID starts the draft; each write increments its immutable version. Client supplies expected review version for optimistic concurrency.

Server service uses inDatasetTransaction(db, datasetId, (repository, tx)) and calls getWorkflowStatus(tx, datasetId, patientId) first, acquiring the canonical patient lock before versioned reads. The service validates the stored context against the canonical demonstrative pack, including rule/category/source mappings; arbitrary URLs never satisfy evidence integrity. It validates ownership/current versions and expected review version; finalized reviews cannot be written again. From MEDICAL_REVIEW_PENDING it starts review only after valid decisions exist. Save appends a draft; CLARIFY routes to CLARIFICATION_REQUIRED and retains completedAt null. Explicit finalize requires no PENDING/CLARIFY, appends completed review, REVIEW_COMPLETED event and MEDICAL_REVIEW_COMPLETED transition in the same transaction. It then calls the existing publishReviewedPlan owner service inside that transaction; publication failure rolls back the review as well. No client status is accepted.

The smallest client form uses useActionState for errors/pending feedback and native labeled controls, prepopulated from the latest review. All mutation inputs are revalidated server-side. Reviewer identity, recorded timestamps and analysis version are visible. Failed writes return safe errors and retain draft input. Completion feedback is shown only after the transaction commits. The form prevents native Server Action reset so a controlled decision cannot visually revert while its draft state remains unchanged.

## Risks / Trade-offs

Atomic transactions serialize this lane and shared state changes; stale/duplicate requests fail rather than overwriting. The canonical patient lock is shared with profile, analysis and workflow producers; this service introduces no separate locking protocol. Synthetic reviews never confer medical validation. Clarification is deliberately incomplete under backlog P0-10, even though the wave brief only explicitly excludes pending finalization.

## Test mapping

Pure tests cover all decisions, required reason/text, missing/duplicate/foreign proposals, blocked/stale results, missing evidence and pending/clarification gates. Service tests cover session scope, server reviewer identity/time, immutable versions, atomic rollback, unauthorized access, stale review CAS and duplicate finalization. PostgreSQL integration verifies concurrent requests. E2E covers approve/modify/reject, refresh recovery, failure feedback and disabled finalization on desktop/mobile.

## Reader review follow-up

PR #21 was merged before its native findings were returned. This task resolves
both findings in the same physician workspace: real rule-blocked records use
system/rule provenance and hide provider attribution, and serious/critical axe
scans cover both the populated queue and workspace on desktop/mobile. The blocked
fixture invokes the real producer with unknown age and asserts no model call.
The pure provenance test reproduces the missing presentation behavior before the
fix. Original P0-09 evidence is clarified to distinguish empty-route scans from
these populated-screen checks.

## Orchestrator scope additions (2026-10-25)

- `MedicalReview.decisions[].clarification` is an additive optional `{ question, targetField? }`. The shared contract keeps `targetField` as a bounded string; the review input schema restricts it to intake `FieldId`s so P0-12 can ask that field. It is absent when the reviewer names no field, and consumers must handle that.
- `listOpenClarificationRequests` keys "open" on the latest workflow transition: CLARIFICATION_REQUIRED by demo-physician with `refs.reviewId`, plus an incomplete review on the referenced analysis. It reuses the caller's transaction and patient lock.
- Opening uses the patient lock, requires the workspace analysis to match the last transition's `analysisId`, and is a no-op otherwise. Queue links disable prefetch so only navigation opens a review. No timeline kind is added; the transition record is the audit.
- A replaced demo case makes the cookie's patient disappear; reader and opener return nothing rather than failing.
