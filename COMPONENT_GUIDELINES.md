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
For real intake, adopt explicit “Não sei” values where appropriate and preserve
answers across navigation once persistence is implemented.

Every new interactive primitive needs keyboard operation, visible focus, touch size,
disabled explanation and error/loading treatment. Update the showcase and add
behavioral tests for meaningful interaction. Avoid snapshot tests that mirror JSX.
