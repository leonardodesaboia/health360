---
name: design-system
description: Enforces the Health360 design system. Use whenever you create or change UI in Health360, including any route, page, layout, component, Tailwind class, color, spacing, typography, icon, empty/error/loading state, form control, or US English interface copy. Also use when reviewing UI diffs for design consistency or accessibility.
---

# Health360 design system

Health360 is a restrained, professional clinical SaaS product ("Clinical Premium SaaS"). It must not look like a generic AI dashboard. This skill is the working checklist. The canonical rules live in the docs below, so read them; don't re-derive them.

## Read first

1. `DESIGN_GUIDELINES.md`: tokens, computed contrast ratios, type scale, spacing, radii, accessibility, anti-patterns.
2. `COMPONENT_GUIDELINES.md`: shared components, variants, states, composition rules.
3. `src/app/globals.css`: the semantic CSS variables and their Tailwind `@theme` mapping. This file is the only place colors are defined.
4. The nearest existing reference screen (`src/app/patient`, `src/app/doctor`) and the `/showcase` route. Copy the established pattern before inventing one.

## Hard rules

- **Tokens only.** Use semantic utilities (`bg-background`, `text-muted-foreground`, `border-border`, `bg-primary text-primary-foreground`, `text-warning-foreground`, and so on). Never put raw hex, `rgb()`, `hsl()`, arbitrary values like `bg-[#...]`, or palette classes like `bg-blue-500` or `text-gray-600` in feature code.
- **New token only with a semantic purpose.** If no token fits, add one in `globals.css` with a foreground pair. Compute its contrast (`node scripts/contrast.mjs` if present, otherwise WCAG formula) and record the ratio in `DESIGN_GUIDELINES.md`. Text needs ≥ 4.5:1; large text and UI boundaries need ≥ 3:1.
- **Reuse before creating.** Search `src/components/{ui,layout,shared}` first. Extend an existing component with a variant (`cva`) rather than forking it. Prefer composing accessible primitives (shadcn/Radix) over hand-built controls. No generic mega-components.
- **Geometry and rhythm.** Use the 4 px spacing scale (4, 8, 12, 16, 24, 32, 40, 48, 64) and the radius tokens (`rounded-sm/md/lg`). Use the standard content widths from `ContentContainer`, not arbitrary `max-w-[...]`.
- **Typography.** Use Geist and the documented scale, with weights 400, 500, and 600 only. Use `tabular-nums` for dates, measurements, and numbers.
- **Restraint.** Don't add gradients, glassmorphism, glows, robot or brain imagery, emoji navigation, cards inside cards, decorative charts, invented scores or metrics, giant pill buttons, heavy shadows, badge clutter, or marketing heroes inside the app.
- **Two densities.** Patient screens are mobile-first, calm, and explanatory, with nav limited to Home, My plan, and History. Physician navigation uses Reviews, Patients, and History as those features become available. Physician screens are desktop-first, dense but uncluttered, use two columns on wide screens (context left, proposals and decisions right), and degrade gracefully.

## Copy (US English)

- All visible text is natural US English in sentence case. Code identifiers stay in English.
- Format displayed dates and numbers with explicit `en-US` Intl formatters; keep ISO values in data contracts. Use `lang="en"` on the HTML document.
- Use precise action labels: "View rationale", "View evidence", "Track my plan". Avoid AI marketing language like "powerful insights" or "revolutionary intelligence".
- Make workflow status explicit, and keep administrative status separate from clinical status. Always say when medical review is pending ("Proposal awaiting physician review").
- Communicate uncertainty honestly. Never claim clinical validation, accuracy, or efficacy. Keep demo labeling visible.

## Accessibility (WCAG 2.2 AA, where practical)

Every interactive element needs:

- a visible label or accessible name;
- a visible focus ring (`ring` token);
- a target of at least 44×44 px on touch layouts;
- disabled and error states, with errors linked to inputs via `aria-describedby`.

Status changes use `role="status"` or a live region. Never convey state by color alone: pair it with text or an icon that has a label. Respect `prefers-reduced-motion`. Use semantic landmarks and headings in order. Don't create dead-end navigation.

## Verify before claiming done

1. Run `pnpm verify` and `pnpm test:e2e`. The e2e suite checks overflow, focus, and routes on desktop and mobile.
2. Inspect the changed screens at 390 px and desktop widths, with keyboard-only navigation, and confirm no horizontal page overflow.
3. When you add or change a reusable pattern, update `/showcase` and `COMPONENT_GUIDELINES.md`.
4. Report which visual and accessibility checks you actually ran. A smoke test is not a full WCAG audit, so don't claim one.
