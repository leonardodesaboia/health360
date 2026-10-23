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
Default unit tests never connect to PostgreSQL. No runtime UI reads this storage yet.

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
`LLM_TIMEOUT_MS`. No provider is installed or invoked now. Keep secrets server-only;
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
It stores synthetic drafts only; no physician sharing, database persistence,
identity enforcement or clinical workflow transition is implemented by this adapter.
A server adapter must enforce ownership and atomic revision checks.
