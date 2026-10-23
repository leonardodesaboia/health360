# Design guidelines

## Direction

Clinical, calm and precise. Ink text, teal actions, mint context surfaces and a cool
canvas support patient comprehension and physician traceability. No gradients,
glass effects, invented metrics, robot imagery or decorative charts.
The patient screen emphasizes the next step; the review workspace separates
declared context from proposals and decisions in two columns on wide screens.

## Token system

`src/app/globals.css` is canonical. CSS variables map through Tailwind v4
`@theme inline`; use `bg-primary`, `text-muted-foreground`, etc. in components.
No raw palette classes or hex values outside this file. Light theme only; future
theme overrides can change variables without changing components.

| Semantic role                  | Value             | Use                        |
| ------------------------------ | ----------------- | -------------------------- |
| background / foreground        | #F8FAF9 / #163B44 | Canvas and ink             |
| card / card-foreground         | #FFFFFF / #163B44 | Content surfaces           |
| primary / primary-foreground   | #167D75 / #FFFFFF | Main action                |
| secondary, accent / foreground | #EAF3EF / #163B44 | Calm emphasis              |
| muted / muted-foreground       | #F0F4F2 / #52655F | Supporting text            |
| border                         | #D9E2DF           | Decorative separators      |
| input                          | #71847E           | Control boundary           |
| ring                           | #167D75           | Focus outline              |
| destructive / foreground       | #A52B36 / #FFFFFF | Errors/destructive action  |
| success / foreground           | #EAF3EF / #236349 | Successful format feedback |
| warning / foreground           | #FFF4DB / #795012 | Missing information        |
| information / foreground       | #EDF3F8 / #305A7D | Prototype context          |
| sidebar / foreground           | #FFFFFF / #163B44 | Shell navigation           |
| navigation-active / foreground | #EAF3EF / #163B44 | Current route              |
| navigation-hover               | #F0F4F2           | Hover surface              |

Secondary text was darkened from the initial #62746F direction for stronger
small-text contrast across surfaces. Decorative borders are not control boundaries;
interactive outlines use the stronger `input` token.

## Computed contrast

Reproduce with `node scripts/contrast.mjs`. WCAG sRGB linearization and
`(lighter + .05) / (darker + .05)`; rounded to two decimals. Text minimum 4.5:1;
focus/control boundaries minimum 3:1. Disabled controls are exempt, never the only
explanation of an unavailable action.

| Pair (foreground / background)        |   Ratio |
| ------------------------------------- | ------: |
| foreground / canvas                   | 11.49:1 |
| card-foreground / card                | 12.05:1 |
| white / teal primary                  |  4.97:1 |
| secondary-foreground / mint           | 10.65:1 |
| muted-foreground / canvas             |  5.92:1 |
| muted-foreground / muted              |  5.59:1 |
| accent-foreground / accent            | 10.65:1 |
| white / destructive                   |  7.00:1 |
| success-foreground / success          |  6.29:1 |
| warning-foreground / warning          |  6.47:1 |
| information-foreground / information  |  6.51:1 |
| sidebar-foreground / sidebar          | 12.05:1 |
| active-foreground / navigation-active | 10.65:1 |
| teal text / canvas                    |  4.74:1 |
| teal text / card                      |  4.97:1 |
| focus ring / canvas                   |  4.74:1 |
| focus ring / card                     |  4.97:1 |
| input boundary / card                 |  3.96:1 |

Ratios describe opaque token pairs, not a full rendered-page audit. Recompute and
inspect whenever adding colored text, opacity, states or surfaces.

## Type, space and geometry

Geist Sans, regular 400, labels 500, headings 600. Page title 28 px mobile / 32 px
desktop; sections 20 px; component headings 16–18 px; body 14–16 px; support
12–14 px. Normal body line-height 1.625; compact headings. Use tabular numerals
for dates and measurements. Copy stays readable below roughly 80 characters per line.

Spacing uses Tailwind's 4 px base: 4, 8, 12, 16, 24, 32, 40, 48, 64 px.
Controls radius 8 px; small accents 6 px; cards 12 px; major surfaces 16 px.
Sections are 32 px apart; surface padding 24 px; mobile page gutter 16 px,
desktop 32 px. Prefer subtle borders to shadows.

Named content widths: `max-w-form` 640 px, `max-w-patient` 1024 px,
`max-w-workspace` 1440 px, `max-w-record` 1152 px, `max-w-dialog` 512 px.
Use `ContentContainer` for page framing. Physician context/proposals collapse
from two columns at large screens to one column. Queue entries reflow as labeled
records on mobile. No horizontal page scroll.

## Accessibility and copy

Semantic headings/landmarks, first-focus skip link, visible 2 px outline with 4 px
offset, 44 px targets, text labels for icons, and `aria-current` for navigation.
Form help/errors connect via `aria-describedby`; errors set `aria-invalid` and
focus the first invalid field. Status feedback uses live regions only for changes.
Reduced-motion preference disables transitions and animation. Never use color alone.

Use natural US English sentence case, clear verbs and honest uncertainty. Workflow status
is not clinical status. Say “Awaiting physician review”, not “Result approved by AI”.
Keep demo/synthetic labels visible, with no implication of medical efficacy.
