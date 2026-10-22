# P0-06 — Replaceable server LLM adapter

Dependencies: P0-05; user-selected provider and separately supplied secret.

All boxes intentionally unchecked. Assignment permits work only within the selected task's scope.

## 1. Inspect and plan

- [ ] 1.1 Confirm dependency completion and external-owner inputs; inspect affected areas: future `src/server/ai` provider/prompts/schema, `.env.example`, tooling/architecture docs.
- [ ] 1.2 Refine design.md with concrete boundaries and map each scenario to a failing test before implementation.

## 2. Implement acceptance behavior with TDD

- [ ] 2.1 Server-only secret and minimized synthetic payload.
- [ ] 2.2 Versioned prompt/context/profile metadata.
- [ ] 2.3 Structured output.
- [ ] 2.4 Bounded timeout.
- [ ] 2.5 No chain-of-thought retained.
- [ ] 2.6 Provider substitution does not change feature UI.

## 3. Verify and review

- [ ] 3.1 Add and pass the required focused checks: mock-provider integration for payload minimization, timeout/API error, schema failures and model configuration; separately authorized synthetic live API check, never clinical certification.
- [ ] 3.2 Run pnpm verify, pnpm test:e2e, pnpm format:check and strict OpenSpec validation; record actual results here.
- [ ] 3.3 Review spec conformance and applicable TypeScript/React, healthcare and security concerns; address findings.
- [ ] 3.4 Update canonical documentation and archive only after implementation and review are complete.

## Evidence

Not implemented. No verification result is claimed for these future scenarios.
