---
name: design-system
description: Enforce Health360 design consistency when creating or changing routes, components, tokens or pt-BR interface copy.
---

Read DESIGN_GUIDELINES.md and COMPONENT_GUIDELINES.md first, then inspect /showcase and the nearest reference screen.
Use semantic CSS variables in src/app/globals.css through Tailwind. Reuse Button, Input, Surface, Notice, PageHeader and ContentContainer.
Keep patient pages calm and mobile-first; physician pages prioritize traceable context and decisions. Use whitespace and hierarchy, not decorative analytics.
No raw hex/RGB or arbitrary color utilities in features. Add a token only when its semantic purpose is clear; compute text and focus contrast when changing colors.
Use pt-BR sentence case and precise action labels. Explicitly communicate pending review and uncertainty. No clinical validation claims.
For a new control, implement label, focus, disabled/error state, 44 px target and reduced-motion behavior.
Verify at 390 px and desktop widths, keyboard-only navigation and no horizontal page overflow. Run pnpm verify and pnpm test:e2e, and update showcase when a reusable pattern changes.
Report visual and accessibility checks actually performed; do not claim a complete WCAG audit from smoke tests.
