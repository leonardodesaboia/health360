# Canonical ordered implementation index

Status at foundation handoff: **all tasks below are planned, not implemented**.
Foundation routes, contracts and fixtures are available. They do not satisfy the
functional MVP acceptance criteria. Source of truth for product substance:
[PRODUCT_CONTEXT.md](../product/PRODUCT_CONTEXT.md). See [AGENTS.md](../../AGENTS.md)
for execution and definition of done. No issues have been published.

Choose one task per implementation session, confirm its scope and dependencies,
and record completion/archive links here. This is the only ordered task index. Split further if a task cannot fit a focused
reviewable change. All data remains synthetic. Agents may author demonstrative
scenarios, rules and expected demo outcomes under [ADR0003](../adr/0003-mvp-runtime-decisions.md):
data and UI carry **DEMONSTRATIVE — NOT CLINICALLY VALIDATED**, evidence is publicly
verifiable (guideline, issuer, year, URL) or explicitly `evidence: placeholder`, and
physician review gates remain mandatory. Placeholders cannot satisfy evidence validation.
Real clinical use requires formal medical review. All entries below remain planned.

## OpenSpec task lifecycle

OpenSpec1.14.3 is the adopted **per-task specification workflow**, installed as the exact devDependency `@fission-ai/openspec`. This document owns order, stable task identity and completion status. An active OpenSpec change owns that task's implementation checklist and precise spec deltas. No second backlog is maintained.

1. Select an authorized planned entry whose dependencies and required inputs are satisfied. Read its goal, affected areas, acceptance criteria and required tests below.
2. At pickup run `pnpm exec openspec new change <stable-id>`. If that change already exists, resume it; do not create a duplicate. Add a proposal referencing this document's stable anchor (for example `../../../docs/backlog/IMPLEMENTATION.md#p0-03`), identify scope/exclusions, and refine spec deltas/design/tasks from the entry. Reference the acceptance criteria instead of copying long lists into parallel documents.
3. Mark the entry **in progress** with a link to its actual change. Plan inside that change, then TDD: meaningful failing test, minimal implementation, refactor. Preserve synthetic-only and medical-review boundaries.
4. Verify the entry's required tests, `pnpm verify`, `pnpm test:e2e`, formatting and `pnpm exec openspec validate --all --strict --no-interactive`. Review spec conformance and applicable clinical, security, TypeScript/React concerns. Record real output in tasks/evidence; foundation smoke does not complete future MVP tasks.
5. After all assigned work and review pass, archive with `pnpm exec openspec archive <stable-id>` (inspect the diff, never force or skip checks). This promotes completed deltas into baseline specs. Mark the entry **done** with its archive, verification and PR links. Do not archive unimplemented plans.

The CLI's `status --json` `isComplete` flag describes planning artifacts, not delivered functionality. Inspect `instructions apply --change <stable-id> --json` for actual checklist progress. Dependencies and scenario-policy requirements are not automatically enforced by CLI readiness.

All 18 entries remain **planned** in this setup. Pre-created unimplemented draft folders were removed when adopting this pickup lifecycle; no implementation or completed archive was discarded. Existing baseline specs describe implemented capabilities only. Workflow comparison and rationale: [ADR0002](../adr/0002-spec-driven-workflow.md); specialist mapping: [WORKFLOW.md](../ai/WORKFLOW.md).

## P0 — Required, ordered

<a id="p0-01"></a>

### P0-01 — Synthetic persistence and version boundaries

- Stable OpenSpec change ID: `p0-01-persistence`.
- Status: **implemented; PR pending**; [archive](../../openspec/changes/archive/2026-10-22-p0-01-persistence/).
- Implementation evidence: [verification](../../openspec/changes/archive/2026-10-22-p0-01-persistence/tasks.md): 169 unit tests, 7 PostgreSQL integration tests, 22 production e2e tests after rebase on main; verify/format/strict specs pass.

- Goal: establish PostgreSQL/Prisma persistence for core records with immutable profile/analysis/plan versions.
- Depends on: foundation. Local environment selected: PostgreSQL 17 via Docker Compose; Prisma remains the planned ORM (ADR0003).
- Areas: future `src/server/db`, Prisma schema/migrations, contracts, `.env.example`, architecture.
- Accept: synthetic seeds only; stable IDs/foreign keys; review/analysis/profile/context version links; previous versions cannot be silently overwritten; no clinical data in logs.
- Tests: isolated DB migration/seed integration, referential integrity, rollback, unique version constraints, no fixture mutation.

<a id="p0-02"></a>

### P0-02 — Demonstration session and reset

- Stable OpenSpec change ID: `p0-02-demo-session`.
- Status: **planned**; change not yet picked up.
- Implementation/archive evidence: none. Add relative change, archive and PR links here only when they exist.

- Goal: select a prepared synthetic case and share its state across patient/doctor views.
- Depends on: P0-01.
- Areas: future demo feature/server service, shells, fixtures.
- Accept: selected case is consistent in both views; reset restores only the current demo dataset; visible prototype labels remain; role switch grants no real authorization.
- Tests: session/case isolation, reset idempotency and scope, navigation and refresh persistence, rejection of invalid case IDs.

<a id="p0-03"></a>

### P0-03 — Guided intake, first slice

- Stable OpenSpec change ID: `p0-03-intake-draft`.
- Status: **done**; [archive](../../openspec/changes/archive/2026-10-22-p0-03-intake-draft/).
- Implementation/archive evidence: [verification](../../openspec/changes/archive/2026-10-22-p0-03-intake-draft/tasks.md); [PR #9](https://github.com/leonardodesaboia/health360/pull/9). Browser-local adapter; database/session integration follows Worker A.

- Goal: implement basic profile and clinical-history steps before extending questions.
- Depends on: P0-01, P0-02; approved minimal scenario fields.
- Areas: `features/health-intake`, `/patient/intake`, shared form/step controls, contracts.
- Accept: configuration-driven steps, back/forward, progress, explicit unknown answers, inline validation, draft save/restore on refresh; no overcollection.
- Tests: Zod conditional fields/unknown handling, draft integration, keyboard/mobile navigation, refresh and error recovery.

<a id="p0-04"></a>

### P0-04 — Intake completion and clinical profile

- Stable OpenSpec change ID: `p0-04-clinical-profile`.
- Status: **planned**; change not yet picked up.
- Implementation/archive evidence: none. Add relative change, archive and PR links here only when they exist.

- Goal: finish habits/medications/examination/review steps and consolidate the versioned profile.
- Depends on: P0-03.
- Areas: intake/profile features, examination contracts, patient reference routes.
- Accept: user can review/edit answers; confirmed submission creates a profile version and completes intake atomically; declared/structured/unknown provenance remains distinct; duplicate submission does not create duplicate cycles.
- Tests: conditional questions, unknown examination date/result, concurrent edits, repeat submit, persisted profile matches answers, flow A pre-analysis slice.

<a id="p0-05"></a>

### P0-05 — Restricted clinical context and deterministic checks

- Stable OpenSpec change ID: `p0-05-clinical-context`.
- Status: **done**; [archive](../../openspec/changes/archive/2026-10-22-p0-05-clinical-context/proposal.md).
- Implementation/archive evidence: [verification and review](../../openspec/changes/archive/2026-10-22-p0-05-clinical-context/tasks.md); PR link follows after creation.

- Goal: load a small versioned demonstrative scenario/context authored by agents under the ADR0003 demonstrative safety policy.
- Depends on: P0-04; agent-authored demonstrative criteria and expected outcomes, with verifiable source metadata or explicit evidence placeholders (ADR0003).
- Areas: future `src/server/clinical-rules`, context fixtures/contracts and scenario docs.
- Accept: deterministic eligibility, contraindication and blocking checks are separate from the LLM; evidence IDs/version/source and review status recorded; unknown data can block or clarify; no broad clinical search/RAG.
- Tests: demonstrative positive/negative/unknown boundary cases, unsupported scenario rejection, missing context version, no autonomous scope expansion.

<a id="p0-06"></a>

### P0-06 — Replaceable server LLM adapter

- Stable OpenSpec change ID: `p0-06-llm-adapter`.
- Status: **implemented; PR pending**; [archive](../../openspec/changes/archive/2026-10-23-p0-06-llm-adapter/proposal.md).
- Implementation evidence: [verification and review](../../openspec/changes/archive/2026-10-23-p0-06-llm-adapter/tasks.md): 202 unit tests (live smoke skipped), 28 production e2e tests after rebase on main; verify/format/strict specs pass. Real API call not run.

- Goal: introduce a provider interface and one external API adapter using configurable provider/model.
- Depends on: P0-05; OpenAI selected (ADR0003), model via `LLM_MODEL`; user supplies `OPENAI_API_KEY` separately. Provider selection is resolved.
- Areas: future `src/server/ai` provider/prompts/schema, `.env.example`, tooling/architecture docs.
- Accept: server-only secret and minimized synthetic payload; versioned prompt/context/profile metadata; structured output; bounded timeout; no chain-of-thought retained; provider substitution does not change feature UI.
- Tests: mock-provider integration for payload minimization, timeout/API error, schema failures and model configuration; separately authorized synthetic live API check, never clinical certification.

<a id="p0-07"></a>

### P0-07 — Validation and analysis orchestration

- Stable OpenSpec change ID: `p0-07-analysis-validation`.
- Status: **planned**; change not yet picked up.
- Implementation/archive evidence: none. Add relative change, archive and PR links here only when they exist.

- Goal: validate evidence/category/required-field integrity and persist preliminary analysis safely.
- Depends on: P0-06.
- Areas: future AI validators/services, analysis contracts, workflow service, status UI.
- Accept: malformed/unsupported/unknown-evidence/insufficient results block analysis; only validated preliminary proposals enter review queue; idempotent retries; current versions checked; failures publish no plan.
- Tests: adversarial structured output, fabricated reference, stale profile, duplicate request, timeout/retry, safe error copy; flow E.

<a id="p0-08"></a>

### P0-08 — Do Not Test slice

- Stable OpenSpec change ID: `p0-08-do-not-test`.
- Status: **planned**; change not yet picked up.
- Implementation/archive evidence: none. Add relative change, archive and PR links here only when they exist.

- Goal: contextualize possible redundancy from an agent-authored demonstrative deterministic rule under ADR0003.
- Depends on: P0-05, P0-07.
- Areas: rules, analysis output, proposal/evidence presentation.
- Accept: records examination data, applied rule ID/version, rationale and limitations; recent examination alone is insufficient; AI explains supplied rule result; remains preliminary until reviewed.
- Tests: demonstrative redundant/nonredundant/unknown cases, missing dates, rule/proposal traceability, no automatic patient advice; flow B through proposal stage.

<a id="p0-09"></a>

### P0-09 — Persisted physician queue and proposal reader

- Stable OpenSpec change ID: `p0-09-review-reader`.
- Status: **planned**; change not yet picked up.
- Implementation/archive evidence: none. Add relative change, archive and PR links here only when they exist.

- Goal: replace the static queue/workspace data with current versioned synthetic analyses.
- Depends on: P0-07, P0-08.
- Areas: clinical-review feature, `/doctor`, `/doctor/reviews/[reviewId]`, shared evidence/proposal components.
- Accept: queue shows patient, real analysis timestamp, administrative status and action; workspace exposes declared context, proposal category/rationale/criteria, evidence/version, missing data and uncertainty via progressive disclosure; actor/record checks on server.
- Tests: empty/error/loading states, invalid ID and cross-session access, responsive keyboard reading, stale analysis warning, correct references.

<a id="p0-10"></a>

### P0-10 — Physician decisions and finalization

- Stable OpenSpec change ID: `p0-10-physician-decisions`.
- Status: **planned**; change not yet picked up.
- Implementation/archive evidence: none. Add relative change, archive and PR links here only when they exist.

- Goal: persist approve/modify/reject/pending/clarify decisions with audit metadata.
- Depends on: P0-09.
- Areas: review decision form/service, MedicalReview contract, workflow handlers.
- Accept: modify/reject require reason; modifications retain revised text; reviewer/time/analysis version recorded; pending decisions prevent finalization; explicit finalization checks current versions and ownership atomically; synthetic reviewer is not represented as real clinical validation.
- Tests: reason validation, pending/clarification block, stale versions, unauthorized mutation, duplicate finalization, concurrent review; A/B review stages.

<a id="p0-11"></a>

### P0-11 — Reviewed preventive plan

- Stable OpenSpec change ID: `p0-11-reviewed-plan`.
- Status: **planned**; change not yet picked up.
- Implementation/archive evidence: none. Add relative change, archive and PR links here only when they exist.

- Goal: publish a patient-facing version derived solely from finalized physician decisions.
- Depends on: P0-10.
- Areas: preventive-plan feature, publication service, `/patient/plan`, contracts.
- Accept: approved/modified actions only; reviewed redundancy, pending information, next steps and action states understandable in US English; all references trace to the review; direct URL/API cannot expose preliminary proposals as a plan.
- Tests: reject/pending exclusion, ownership, review bypass rejection, stale cycle rejection, repeat publication idempotency, output matches decisions; complete flows A/B.

<a id="p0-12"></a>

### P0-12 — Deterministic clarification loop

- Stable OpenSpec change ID: `p0-12-clarification`.
- Status: **planned**; change not yet picked up.
- Implementation/archive evidence: none. Add relative change, archive and PR links here only when they exist.

- Goal: collect application-selected missing fields without a chatbot.
- Depends on: P0-07, P0-10.
- Areas: clarification feature, intake/profile updates, workflow service.
- Accept: restricted question templates selected by required gaps; explicit “I don't know”; persisted answer creates a profile version and re-enters analysis; unresolved unknowns remain blocked where required; review-origin clarification invalidates stale proposals.
- Tests: supported/unsupported fields, unknown answer, refresh recovery, new profile version, stale review rejection, no direct transition to plan; flow C.

<a id="p0-13"></a>

### P0-13 — Longitudinal history and reassessment

- Stable OpenSpec change ID: `p0-13-reassessment`.
- Status: **planned**; change not yet picked up.
- Implementation/archive evidence: none. Add relative change, archive and PR links here only when they exist.

- Goal: preserve events and prior plans while a new cycle is prepared.
- Depends on: P0-11, P0-12.
- Areas: health-timeline feature, profile versioning, plan history UI/service.
- Accept: profile/intake/analysis/review/publication events with provenance/version; new data enters REASSESSMENT_PENDING; reanalysis and review create a new plan; old plan remains identified as previous and readable; no predictive twin.
- Tests: immutable prior versions, chronological ordering, cycle/version links, unfinished reassessment, duplicated event handling; flow D.

<a id="p0-14"></a>

### P0-14 — Prepared demonstration and complete acceptance suite

- Stable OpenSpec change ID: `p0-14-demo-acceptance`.
- Status: **planned**; change not yet picked up.
- Implementation/archive evidence: none. Add relative change, archive and PR links here only when they exist.

- Goal: assemble an explicitly synthetic reproducible HISIC demonstration across A–E.
- Depends on: P0-01 through P0-13.
- Areas: scenario fixtures, reset, Playwright flows, runbook and docs.
- Accept: at least one prepared full case with agent-authored demonstrative expected outcomes under ADR0003; all 18 product acceptance points demonstrated, resettable, with failure/retry path; no fake metrics, validation claims or silent success stubs.
- Tests: run A–E end-to-end on desktop/mobile; verify refresh persistence, reset isolation, keyboard access; record actual provider integration separately from deterministic mocked CI.

## P1 — Optional after P0

<a id="p1-01"></a>

### P1-01 — AI-assisted question phrasing

- Stable OpenSpec change ID: `p1-01-question-phrasing`.
- Status: **planned**; change not yet picked up.
- Implementation/archive evidence: none. Add relative change, archive and PR links here only when they exist.

- Goal: improve wording of deterministic clarification questions.
- Depends on: P0-12, P0-06.
- Areas: clarification prompt/service and question UI.
- Accept: model cannot choose new clinical fields or scope; template fallback on failure; explicit unknown remains possible.
- Tests: prompt injection, out-of-scope phrasing, malformed output, timeout fallback, preserved field identity.

<a id="p1-02"></a>

### P1-02 — Compare plan versions

- Stable OpenSpec change ID: `p1-02-plan-comparison`.
- Status: **planned**; change not yet picked up.
- Implementation/archive evidence: none. Add relative change, archive and PR links here only when they exist.

- Goal: show additions/changes/removals between physician-reviewed versions.
- Depends on: P0-13.
- Areas: preventive-plan comparison UI/pure diff functions.
- Accept: immutable original text, explicit dates/versions and clinical-review provenance; incomplete drafts cannot appear as reviewed changes.
- Tests: unchanged/added/modified/removed actions, ownership, accessibility and mobile layout, draft exclusion.

<a id="p1-03"></a>

### P1-03 — Summaries of changes

- Stable OpenSpec change ID: `p1-03-change-summaries`.
- Status: **planned**; change not yet picked up.
- Implementation/archive evidence: none. Add relative change, archive and PR links here only when they exist.

- Goal: concise contextual summaries grounded in structured version differences.
- Depends on: P1-02, P0-06, P0-07.
- Areas: future AI summary service/validators and history view.
- Accept: no new medical conclusion; every statement grounded in supplied diff; unavailable state on failure; physician/patient wording separated.
- Tests: invented-change rejection, stale version, empty diff, timeout, no autonomous recommendation.

<a id="p1-04"></a>

### P1-04 — Demonstration usability improvements

- Stable OpenSpec change ID: `p1-04-demo-usability`.
- Status: **planned**; change not yet picked up.
- Implementation/archive evidence: none. Add relative change, archive and PR links here only when they exist.

- Goal: improve prepared-case selection and presentation from observed demo feedback.
- Depends on: P0-14; concrete feedback selected by owner.
- Areas: demo selector/runbook, shared UI, scenario docs.
- Accept: faster access to known cases, explicit reset state, retained synthetic labels; no commercial/clinical scope expansion.
- Tests: case/reset consistency across views, keyboard use, mobile overflow, regression of A–E.

## P2 — Deferred

Commercial features, external integrations and advanced clinical intelligence require
fresh scoping. Product section 19 remains excluded: proprietary model/training,
predictive ML, knowledge graphs, multiagent orchestration, complex RAG/vector DB,
native mobile, laboratory/hospital integrations, telemedicine, payments, scheduling,
OCR, open medical chatbot, marketplace, enterprise dashboards, wearables and real-patient use.

## Future end-to-end acceptance specifications

These are specifications, **not skipped tests presented as passing**. Implement each
under `tests/e2e` when its dependencies exist. CI uses deterministic provider stubs
at the adapter boundary; a controlled live API test uses only synthetic data and
separate authorization. Both verify engineering behavior, not clinical efficacy.

### Flow A — First evaluation (P0-01–11)

Given a reset synthetic case without a plan, when the patient starts intake, enters
the required scenario data/unknown answers, navigates back, edits, confirms and reloads,
then answers persist and a versioned profile exists. When analysis runs, then the
backend loads the chosen versioned context and validates structured output. Patient
plan access remains unavailable. When the physician opens the queue, inspects context
and evidence, records every decision and explicitly finalizes, then a reviewed plan
appears containing only those decisions. Reject direct publication before review.

### Flow B — Do Not Test (P0-08–11)

Given an agent-authored demonstrative synthetic prior-exam case, when the deterministic rule
runs, then considered data, rule/version, limitations and possible redundancy are
traceable. When AI explains it, then no evidence outside supplied context appears.
When the physician accepts/modifies/rejects with the required reason, then the
persisted decision and patient plan match. A recent exam in the negative-control
case must not automatically become “unnecessary”. Pending decisions block publication.

### Flow C — Clarification (P0-12)

Given essential information is missing, when analysis or review requests a supported
field, then the patient sees a bounded complementary question with “I don't know”. When
answered, then the new profile version persists, a new analysis runs and the prior
analysis cannot be finalized as current. If unknown remains insufficient, then the
case stays explicitly blocked/needs clarification; no fabricated fact or plan appears.

### Flow D — Reassessment (P0-13)

Given an existing reviewed plan v1, when the patient updates a relevant fact, then
a new profile version enters reassessment, and plan v1 remains preserved. When a
fresh analysis and physician review finish, then plan v2 links to its current review
and prior plan. Timeline shows both cycles and provenance; reloading or a failed
second analysis cannot overwrite v1 or imply v2 is available.

### Flow E — AI failure (P0-07)

Given a completed synthetic intake, when the provider times out, returns malformed
output, an unsupported category, nonexistent evidence or insufficient support, then
analysis is blocked/failed with clear US English feedback and no patient plan/proposal is
published. When the user retries with a valid result, then exactly one current
analysis enters medical review pending. Review remains mandatory. Verify bounded
retry, idempotency, no leaked key/raw output and no fallback recommendation.
