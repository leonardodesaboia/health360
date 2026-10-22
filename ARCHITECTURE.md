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

## Future server boundaries

When authorized, add `src/server` modules marked with `import "server-only"`:

- DB/repositories: synthetic data, transactions, immutable versions and reset isolation.
- Clinical context/rules: restricted medically owned scenarios, versioned evidence,
  deterministic eligibility/contraindication/blocking checks. No clinical criteria invented by an agent.
- AI: provider interface → minimal profile/context input → versioned prompt → structured
  output parsing → evidence/category/required-field validators → blocked or review-pending result.
- Review/publication: authorize actor and ownership; verify current analysis/profile/context,
  completed review and explicit finalization; atomically publish only reviewed decisions.

The LLM is replaceable via `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY` and
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
No platform deployment, production credentials or public publishing is part of setup.

## Verification boundaries

Vitest checks all state pairs and unknown-data contracts. Playwright checks every
route, role/navigation links, no page overflow at desktop/mobile, runtime errors,
keyboard skip focus, accessible example validation, disabled decisions and unknown IDs.
These are technical smoke tests, not clinical validation, a complete accessibility audit,
or end-to-end MVP flows. Future flow specifications are in the backlog.
