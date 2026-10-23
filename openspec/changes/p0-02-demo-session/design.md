# Design

## Boundaries

- `src/server/demo/contracts.ts`: case IDs (`z.enum` of P0-05 scenario IDs), cookie name, token schema, `DemoSession` type and display labels.
- `src/server/demo/records.ts`: pure mapping from a P0-05 scenario input to P0-01 patient, profile and examination records. Patient status is `NOT_STARTED`. No analysis, review, plan or timeline rows, because no clinical work has happened.
- `src/server/demo/store.ts`: DB operations taking an explicit Prisma client and dataset ID. `replaceDemoDataset` deletes the dataset (cascade) and reseeds it in one transaction, under `pg_advisory_xact_lock` like `seedDataset`. `loadDemoCase` only reads.
- `src/server/demo/session.ts`: cookie handling. `getDemoSession()` validates the token, derives `datasetId = "demo-" + sha256(token)` (first 32 hex characters) and returns `null` for a missing or malformed cookie, a missing dataset or an unknown stored scenario. Page renders never write.
- `src/app/demo-actions.ts` (`"use server"`): `selectDemoCase(formData)` validates the case ID, creates a token cookie if absent and replaces the dataset. `resetDemo()` replaces the current dataset with its stored case, or redirects to the selector when there is none.
- Cookie: `httpOnly`, `sameSite: "lax"`, `path: "/"`. `secure` is set only when `DEMO_COOKIE_SECURE=true`, because the local and CI production builds run over plain HTTP on 127.0.0.1. Any HTTPS deployment must set it.
- The Prisma client is a lazily created server-only singleton (`getDatabase()`).

## Routes

- `/`: case selector (two synthetic cases), current selection and reset.
- `/patient`, `/doctor`: show the session patient and stored profile summary, or an empty state that links to `/`.
- `/doctor/reviews/[reviewId]`: dynamic. Renders only when `reviewId === "review-" + session.caseId`; anything else returns 404, so another case's workspace is not disclosed.
- `/patient/intake`, `/patient/plan`: unchanged fixtures (other lanes). This is a known inconsistency, noted in the PR, until P0-03/P0-04 wire them to `getDemoSession()`.

## Failure behavior

Invalid case ID: the action throws before any write, and the current dataset is unchanged. Malformed or unknown cookie: treated as no session. Database unavailable: the route error boundary shows the generic recovery screen; no fixture fallback pretends that state was loaded.

## Gaps

P0-05 `facts` (symptoms, prior screening, completeness) have no P0-01 column, so DB-backed cases cannot be re-evaluated by the rules yet. Storing them is the P0-04 profile question.

## Test map

- Unit (`src/server/demo/*.test.ts`): case ID and token rejection, dataset ID derivation, scenario → record mapping (unknowns preserved, no clinical rows, fixtures not mutated).
- Integration (`tests/integration/demo-session.test.ts`): select and load, reset idempotency (identical records twice), reset scope (another session unchanged), invalid case ID leaves the dataset intact, case switch replaces records.
- E2E (`tests/e2e/demo-session.spec.ts`): select → same patient in patient and doctor views, refresh and navigation persistence, reset keeps the case, empty state without a session, other-case review ID returns 404, prototype labels remain.

## Phase A implementation updates

The first PR exports server-only functions and changes no routes. getDemoSession returns the stored case plus datasetId and patientId. selectDemoCaseForSession and resetDemoSession must be invoked from a Server Action/Route Handler that may set response cookies. resetDemoDataset resolves the current case inside the dataset lock. loadDemoCase uses a repeatable-read transaction, returns the latest profile and authoritative workflow status, and rejects incomplete data. Reset also obtains current patient workflow locks before deleting/reseeding, coordinating with in-flight workflow writes. getDatabase is a lazy process-level server-only pool.

Intake and plan remain outside this lane. Their workers wire getDemoSession. UI actions/selection/navigation/error states above are deferred to the separate presenter UI PR, not claimed implemented here.
