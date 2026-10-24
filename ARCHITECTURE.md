# Architecture

## Implemented foundation

Single Next.js App Router application. Routes are Server Components by default;
only active navigation, the component form example and route error recovery need
client state. No global store is necessary. Geist is bundled from the `geist` package,
so font loading does not require Google Fonts access during build.

```text
src/app/                         Route composition, metadata, global tokens
src/components/layout/          Shells, responsive navigation, page framing
src/components/ui/              Source-owned shadcn composition primitives
src/components/shared/          Feedback, status, evidence disclosure, form example
src/features/patients/          Ten entity contracts and synthetic fixtures
src/features/workflow/          Framework-free transition graph and labels
tests/e2e/                      Desktop/mobile production smoke tests
scripts/contrast.mjs             Reproducible token contrast calculation
```

No empty service/database folders are generated. Add a feature directory only when
implementing real behavior for a selected backlog task. Shared visual components
do not perform database access, invoke providers or decide clinical eligibility.

## Contracts

`features/patients/contracts.ts` defines Patient, HealthProfile, IntakeResponse,
PreviousExamination, ClinicalContext, AIAnalysis, RecommendationProposal,
MedicalReview, PreventivePlan and TimelineEvent with matching inferred types.
These are starting contracts, not persistence models. Add constraints as the owning
task introduces real use cases. Schema-valid does not mean evidence-valid or
clinically reviewed. A future service must check referential integrity, ownership,
allowed categories, decision reasons and version consistency.

Unknown clinical values use `null` and explicit missing-information lists. Provenance
distinguishes patient-reported, system-structured, rule-generated, AI-generated and
physician-reviewed content. Synthetic fixtures are parsed at load time and never mutated.
The queue's review ID is a display fixture, not a persisted MedicalReview.

## Implemented synthetic persistence

Prisma 7 and PostgreSQL 17 store dataset-scoped core records through server-only
repositories in src/server/db. Zod validates JSON payloads; relational keys bind
patients, examinations, immutable profile/context/analysis/review/plan versions and
timeline events. SQL triggers reject historical updates and deletes. Explicit
Dataset deletion cascades within that dataset, providing the later demo reset boundary.

Run pnpm db:up, pnpm db:migrate and pnpm db:seed after copying .env.example.
Build/typecheck generate the Prisma client. DATABASE_URL is server-only. The seed
is synthetic and blocked; it performs no clinical analysis or publication.
Repository list/append operations require a dataset ID; inDatasetTransaction rolls
back a complete operation. These persistence APIs are internal: future services
must enforce actor identity, freshness, evidence and finalized physician review.

Integration tests require TEST_DATABASE_URL pointing to a disposable database.
Apply migrations with DATABASE_URL set to that URL, then run pnpm test:integration.
Default unit tests never connect to PostgreSQL.

## Reviewed preventive plan

`src/server/preventive-plan` publishes immutable plans from finalized, current
demonstration physician decisions and reads only the selected session dataset.
The finalization producer calls `publishReviewedPlan(tx, datasetId, patientId, reviewId)`
inside its dataset transaction after `MEDICAL_REVIEW_COMPLETED`. The canonical
workflow read acquires the patient advisory lock before record/version reads.
Publication appends only a plan, its publication event and the canonical workflow
transition; it never writes analyses or medical reviews. Repeated calls for the
same review return the original plan. Pending or clarification decisions, stale
versions, missing evidence and cross-patient references fail closed.

`/patient/plan` displays persisted reviewed content or explicit session, review,
clarification and blocked states. The reader verifies stored text against the
linked finalized decisions before returning a plan; it never returns proposal
records to the patient UI. An earlier plan remains identified as previous while
a new cycle is unfinished. Demonstration review is not medical validation.

## Future server boundaries

P0-05 implements the restricted server-only `src/server/clinical-rules` layer:
versioned demonstrative colorectal screening context, synthetic scenario inputs,
and pure deterministic eligibility/exclusion/clarification/redundancy checks.
It wraps existing profile/examination contracts with explicit nullable screening
facts; it has no database, provider or publication dependency. Findings require
physician review and always deny publication authority. See the
[scenario pack](docs/product/DEMO_SCENARIOS.md) for limits and source verification.
Other server services below remain future work.

When authorized, add `src/server` modules marked with `import "server-only"`:

- DB/repositories: synthetic data, transactions, immutable versions and reset isolation.
- Clinical context/rules: restricted demonstrative scenarios under ADR0003, versioned evidence,
  deterministic eligibility/contraindication/blocking checks. Agent-authored demo rules follow [ADR0003](docs/adr/0003-mvp-runtime-decisions.md); real clinical use requires formal medical review.
- AI: provider interface → minimal profile/context input → versioned prompt → structured
  output parsing → evidence/category/required-field validators → blocked or review-pending result.
- Review/publication: authorize actor and ownership; verify current analysis/profile/context,
  completed review and explicit finalization; atomically publish only reviewed decisions.

The LLM is replaceable via `LLM_PROVIDER`, `LLM_MODEL`, `OPENAI_API_KEY` and
`LLM_TIMEOUT_MS`. The adapter is implemented under `src/server/ai`; no route invokes it yet. Keep secrets server-only;
do not retain chain-of-thought or log raw prompts/identifiers. Avoid sending display names.
Timeouts, invalid outputs and insufficient evidence fail closed with bounded retries.

## Trust and deployment

All present routes are public demonstration pages. Role switching changes URLs only;
it grants no role or session. Real deployment requires authentication, server-side
authorization, actor/record scoping and privacy/security review before real data.
Never infer authority from the pathname, a cookie supplied by the client, or a disabled button.
The workflow function checks legal edges only; it cannot prove medical review occurred.
No UI invokes the transition function to fabricate progress.

Unrecognized review IDs return 404. All demo content remains clearly marked.
The current fixture state is illustrative and does not mean a real analysis exists.
The public repository includes local Postgres Compose and a production standalone
Dockerfile. The selected deployment target is a VPS with Easypanel and a separate
Postgres service; see [the runbook](docs/deploy/easypanel.md). No deployment has
been performed by this setup.

## Verification boundaries

Vitest checks all state pairs and unknown-data contracts. Playwright checks every
route, role/navigation links, no page overflow at desktop/mobile, runtime errors,
keyboard skip focus, accessible example validation, disabled decisions and unknown IDs.
An axe smoke checks the main routes for serious/critical violations.
These are technical smoke tests, not clinical validation, a complete accessibility audit,
or end-to-end MVP flows. Future flow specifications are in the backlog.

## Guided intake draft (P0-03)

`src/features/health-intake` owns the configuration-driven RHF/Zod intake and its
async `IntakeDraftRepository` port. The temporary browser-local adapter validates
draft envelopes, scopes by synthetic patient ID and checks expected revisions.
P0-04 adds atomic confirmed intake/profile snapshots, idempotent submit and immutable
history in the same browser storage envelope. Web Locks serialize cross-tab writes.
No physician sharing, database persistence, identity enforcement or clinical workflow
transition is implemented by this temporary adapter.
A server adapter must enforce ownership and atomic revision checks.

## Persisted workflow API

Internal services use src/server/workflow/state.ts:

- getWorkflowStatus(db, datasetId, patientId) returns Promise<WorkflowStatus>.
- transitionWorkflow(db, datasetId, { patientId, expectedFrom, expectedRefs?, to, actor, reason?, refs? }) returns Promise<WorkflowStatus>.

Both accept PrismaClient or Prisma.TransactionClient. inDatasetTransaction passes
(repository, tx) to its callback; existing one-argument callbacks remain valid. A root-client transition
creates a transaction; an existing transaction keeps domain writes and state atomic.
The service serializes each dataset/patient, rejects stale expectedFrom and illegal
graph edges, and appends a versioned workflowTransition repository record. Reads use
the latest transition or the immutable initial patient status. Patient snapshots
are never overwritten. Actor is patient, system or demo-physician; optional audit
references are profileVersion, analysisId, reviewId and planId.

This is administrative persistence, not authentication or clinical authorization.
The calling service must validate identity, reference ownership/freshness, evidence
and finalized physician review before advancing state. No UI calls the API yet.

getWorkflowState(db, datasetId, patientId) returns {status,lastTransition}, with
null history for the initial snapshot. Its patient lock lasts through the caller's
transaction. Optional expectedRefs compares supplied fields to the latest transition
refs under this lock; status or refs mismatches throw exported StaleStateError.
Analysis/review services should bind attempts by expectedRefs to reject ABA retries.

## Implemented synthetic LLM adapter (P0-06)

`src/server/ai/analyze.ts` is the feature-independent entry point. It accepts unknown
input and an `LlmProvider`; `analyzeFromEnv` selects an explicitly configured provider.
`schemas/analysis.ts` exports `AnalysisInput`, `ClinicalContextInput` and
`AnalysisOutput`. Existing domain contracts remain unchanged. P0-05 callers map
versioned evidence (ID, version, title, issuer, year, URL, excerpt, supported or
placeholder) and deterministic allowed proposals (rule ID, category, evidence IDs)
into this context. An empty allowed set permits no proposals. A supported flag means
supplied source support, never medical validation; callers verify sources before use.

Callers select only necessary synthetic clinical facts. The adapter projects the
HealthProfile clinical fields and prior exams, stripping identity keys and entity
links, and preserves null unknowns. Clinical text must never contain identifiers.
Profile version stays in local metadata; no patient or profile ID enters the model
request. The versioned prompt treats clinical text as data and limits explanations
to supplied deterministic scope. Zod and evidence/scope checks are software gates,
not clinical approval or semantic verification of every generated statement.

OpenAI uses the official SDK Responses API, strict structured output and store:false,
with no tools, reasoning summaries or automatic retries. Configuration uses
LLM_PROVIDER=openai, LLM_MODEL (ADR0003 selects gpt-6-astra), OPENAI_API_KEY and
LLM_TIMEOUT_MS (default 30000, bounded to 1–120000 ms). Missing/invalid configuration
blocks. LLM_PROVIDER=mock explicitly selects deterministic preliminary explanations of
supplied allowed findings; failures never switch providers. No prompts, raw errors, responses or
private chain-of-thought are logged or persisted. Provider retention policies still
apply; store:false is not a claim of zero provider retention.

The default mock copies rationale records from minimized SYSTEM_STRUCTURED personal
history using `Rule <id>, version <n>; evidence version <n>: <rationale>`. Each allowed
finding must have one unambiguous record with matching supplied evidence versions.
It emits exact supplied rule/evidence scope, never new rules; absent or ambiguous
support blocks. Empty allowed scope stays empty. Explicit test-result injection is
unchanged. The mock is demonstrative engineering behavior, never clinical approval.

Results are BLOCKED with a bounded reason, or NEEDS_REVIEW with AI_GENERATED
provenance, demonstrative validation, structured data and prompt/profile/context/
provider/model metadata. No persistence, workflow transition or publication exists
in this layer. P0-07 owns freshness checks, orchestration and idempotent persistence;
physician review and explicit finalization remain mandatory downstream.

Tests inject deterministic providers and HTTP responses without live API calls.
For a separately authorized synthetic live connectivity check, explicitly set
LLM_LIVE_SMOKE=1 plus the OpenAI configuration, then run
`pnpm exec vitest run src/server/ai/live-smoke.test.ts`. It is always skipped when CI
is set. This check proves connectivity only; it does not establish clinical validity.
The implementation follows the [official Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs)
and the installed SDK declarations (OpenAI 7.43.0).

For shared-machine e2e verification, Playwright honors PORT (default 3100) for both
the production server and test base URL. A busy port is never reused or stopped.

## Demonstration session module (P0-02 phase A)

Server-only src/server/demo/session.ts resolves an opaque httpOnly cookie to one
synthetic dataset. getDemoSession returns null for absent/malformed/unknown sessions
and otherwise returns datasetId, patientId, caseId, patient, latest profile and
linked examinations, plus the stored canonical clinicalContext (including id/version,
evidence metadata, rules and demonstrative labels). Patient status comes from the authoritative workflow API.
Page reads never seed data; database/incomplete-record errors propagate.

selectDemoCaseForSession(caseId: unknown): Promise<void> validates a prepared case,
transactionally replaces only the cookie-derived dataset, then sets the cookie.
resetDemoSession(): Promise<boolean> resets that dataset's current stored case,
returning false for no selection. Invoke mutations only from Server Actions or
Route Handlers; they are not public endpoints or authentication.

Storage helpers in store.ts accept (db: PrismaClient, datasetId: string):
loadDemoCase returns Promise<StoredDemoCase | null>; resetDemoDataset returns
Promise<boolean>; replaceDemoDataset adds caseId: DemoCaseId and returns Promise<void>.
These are internal APIs: request handlers derive dataset scope through getDemoSession,
never from client-supplied record IDs. Reads use one repeatable-read snapshot; reset
serializes the dataset and current patient workflow locks before replacing records.
No analysis, decision or plan is fabricated by selection/reset.

Case IDs are first-screening and repeat-screening, reusing P0-05 fixtures.
DEMO_COOKIE_SECURE=true enables Secure cookies for HTTPS deployment; local HTTP
preview and CI leave it false. getDatabase lazily creates one server-only Prisma
pool per process. This phase has no route changes: case-selection UI and shell
integration remain planned. Intake and plan workers own their session wiring.

Selection/reset also persists loadClinicalContext(caseId, 1) as a validated P0-05
context snapshot. This uses the extended P0-05 schema directly so its issuer/year,
rule versions and demonstrative labels survive the narrower legacy core context
repository parser. The session returns that stored snapshot; analysis can reference
clinicalContext.id/version through its dataset-scoped foreign key.

## Clinical profile (P0-04)

The optional typed `HealthProfile.intakeFacts` preserves patient-reported boolean/null
CRC symptoms and risk facts, prior screening and colonoscopy quality. Existing arrays
remain compatible. Examination `datePrecision` and `approximateDate` are optional;
`performedAt` remains null unless the date is exact. The pure projection stores
completed IntakeResponse plus examinations and a new immutable HealthProfile together.
`/patient/profile` shows structured version/date metadata separately from declared and
unknown answers. No score, clinical eligibility, analysis or plan publication occurs.
Server integration must resolve P0-02 getDemoSession and bind datasetRepository to its
trusted datasetId; patientId alone is not a storage isolation boundary.

## Intake session wiring

Server-only src/server/intake/service.ts runs inside one inDatasetTransaction per call.
startIntake moves NOT_STARTED to INTAKE_IN_PROGRESS (actor patient) and leaves later
states unchanged. completeIntake stores examinations, the next immutable HealthProfile
version and the IntakeResponse, together with INTAKE_IN_PROGRESS to INTAKE_COMPLETED
(actor patient, refs.profileVersion). A stale or repeated submission rolls back every write.
The server actions in features/health-intake/actions.ts derive the dataset only from
getDemoSession. The first draft save starts intake. A successful submit redirects to
/patient/analysis. Without a demo session the form keeps its browser-local synthetic flow.
