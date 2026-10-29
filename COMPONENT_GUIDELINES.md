# Component guidelines

Inspect `/showcase` before adding a shared pattern. Base APIs use typed native props,
semantic tokens and `className` composition through `cn` (clsx + tailwind-merge).
Build only controls used by the selected feature; no speculative mega-components.

| Component                  | Ownership and use                                                              |
| -------------------------- | ------------------------------------------------------------------------------ |
| PatientShell / DoctorShell | Shared brand/banner/role switch/footer, distinct navigation                    |
| Navigation                 | Small client island; active route from `usePathname`; wraps at mobile widths   |
| ContentContainer           | `width="patient"`, `"workspace"` or `"form"`; page spacing                     |
| PageHeader                 | Eyebrow context, single h1, description, optional meaningful action            |
| Button                     | shadcn CVA + Radix Slot pattern; default, outline, ghost, destructive          |
| Input                      | Native accessible input; invalid and disabled styles; pair with label/help     |
| Surface                    | Section with border/padding; caller supplies a meaningful heading              |
| StatusIndicator            | Exhaustive workflow label; administrative status, no medical implication       |
| Notice                     | Information or warning tone, icon plus text; no alarm role for static messages |
| InformationGap             | Explicit missing facts; never treats unknown as normal/negative                |
| EvidenceDetails            | Native keyboard-operable details disclosure; no invented references            |
| EmptyState                 | Title, explanation and optional real action; no decorative button              |
| LoadingState / ErrorState  | Status/alert semantics; actual retry supplied by route boundary                |
| FormExample                | Non-clinical RHF + Zod pattern; ephemeral, not intake/persistence              |

## Composition

Use `Button asChild` with a Next Link for navigation. Use a native button for actions;
do not nest links/buttons. All buttons need a useful effect or explicit disabled
state and nearby explanation. Do not simulate saving, analysis or medical approval.
Use one primary action per section and keep destructive actions explicit.

`Button` and `Input` use source-owned shadcn conventions adapted for Health360 tokens
and 44 px touch targets. `components.json` enables future shadcn additions; inspect
generated diffs and normalize tokens instead of overwriting the design system.
Native semantic controls are sufficient where no complex interaction is needed.

The review screen uses `Surface` sections for context and future proposals. Do not
create a clinical recommendation card with plausible medical advice just to fill a
layout. Implement real proposal/evidence/review controls only in their backlog tasks.
Select, radio cards, checkbox, dialogs and intake step/progress components remain
deferred until a functional feature requires them.

## Forms and states

The showcase demonstrates `label` + help + input + connected error, Zod parsing,
RHF first-error focus and a `role="status"` success message. Success means format
validation only; it does not imply data saved or clinically reviewed.
For real intake, adopt explicit “I don't know” values where appropriate and preserve
answers across navigation once persistence is implemented.

Every new interactive primitive needs keyboard operation, visible focus, touch size,
disabled explanation and error/loading treatment. Update the showcase and add
behavioral tests for meaningful interaction. Avoid snapshot tests that mirror JSX.

## Evaluation guidance

`workflowPresentation(snapshot, page)` projects the current administrative cycle into
Intake, Analysis, Physician review and Plan. Supply only the recorded status,
guarded plan availability, saved-analysis recovery availability, and safe outcome
guidance from the stored analysis. Never include proposals or preliminary AI text.
Out-of-scope and deterministic blocked results explain their provenance and offer
Update my information; provider failures offer retry and missing facts lead to
clarification. Existing out-of-scope records use a read-only evaluator replay with
the exact saved profile/context versions to distinguish age and family-history
exclusions. Presentation never changes eligibility or publication state. A missing/unavailable plan read cannot
complete the Plan stage. Route read failures remain route errors.

`JourneyProgress({ model, id })` is informational, with an ordered list and text
states. At mobile widths it uses a native disclosure, open on Home and closed on
other routes. The branch stays visible. Only an active stage has `aria-current="step"`.
The caller supplies a unique heading ID. Complete means recorded administrative
work, never clinical validation.

`NextStepPanel({ model, id, taskAction? })` owns “What happens next,” the explanation,
responsible actor and one primary action. Its description ID is `${id}-description`.
Links use Button/Link; refresh uses `WorkflowRefreshButton`, which calls
`router.refresh()` and never writes workflow state. Task slots use the existing
form/action with the exact model label. If an intake or clarification form already
owns the action, use the model directly in that form, connect its heading and
description with ARIA, and omit the extra panel rather than duplicating submits.
History retains its existing guarded update form as its one primary task.

The shell keeps the full demonstrative banner and role visible at every width.
Role switching is demo navigation only. Presenter controls are a separate native
disclosure, closed after case selection and navigation, expanded with no selected
session. Case identity and selected starting-point label remain visible outside it;
errors remain visible when closed. Reset restores this browser's selected starting
point; it is not undo. Prepared loading replaces only this browser's selected case.

At desktop widths, the expanded presenter disclosure keeps case selection,
Prepared starting points and Reset demo on one control row. Mobile controls stack
and wrap. The component library remains available by `/showcase` URL only.
A prepared starting point requires the mock provider for reset. If provider
capability changed after a restart, a failed reset re-reads that capability and
explains the mock requirement plus the plain-case selection recovery. Other reset
failures report an unconfirmed outcome and ask the presenter to reload; they do
not claim a storage outage or a successful reset.

Physician proposal articles show Proposed and Why inline using only each recorded
rule reference's rationale. Both lines carry Rule-generated provenance. The full
AI-generated explanation (labeled Deterministic mock when applicable), rule
criteria, uncertainty and evidence remain in keyboard-operable disclosures.
Missing rule references are labeled unavailable rather than attributing AI text
to deterministic rules. Mock titles and summaries extract supplied rationale
wording; approved action titles therefore remain specific on the patient plan.
