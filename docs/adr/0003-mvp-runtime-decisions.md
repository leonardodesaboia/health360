# ADR 0003: MVP runtime and demonstrative scenarios

Accepted 2026-10-22 by the user. Persistence and the LLM adapter have since landed;
see [current status](../STATUS.md) for delivery and remaining integration gaps.

- Local database: PostgreSQL 17 in Docker Compose; Prisma is the implemented ORM
  for P0-01. The local database environment decision is resolved.
- Provider: OpenAI, with the model selected through `LLM_MODEL`, never application
  code. The user's "Astra" selection maps to `gpt-6-astra` in the
  [official model catalog](https://developers.openai.com/api/docs/models), checked
  2026-10-22. `OPENAI_API_KEY` is supplied separately and stays server-only.
- Deployment target: VPS with Easypanel, building the app's Dockerfile and running
  a separate PostgreSQL service. This decision does not deploy anything.
- Repository remains public. Commit no secrets, real data or patient information.

Agents may author synthetic patient scenarios, demonstrative rules and expected
outcomes for the MVP demo without an external clinical owner. Every authored rule
or scenario must carry `validation: "demonstrative"` (or equivalent `reviewStatus`)
and display **DEMONSTRATIVE — NOT CLINICALLY VALIDATED** wherever shown in the UI.
Evidence must cite a real, publicly verifiable source with guideline name, issuer,
year and URL. Fabricated citations, invented statistics and accuracy claims are
forbidden. Unsupported rules must explicitly carry `evidence: placeholder` and
display that limitation; a placeholder never counts as validated evidence or
bypasses evidence validators or publication gates.

In-app physician review and explicit finalization remain mandatory. A synthetic
reviewer never confers real clinical validation. Real clinical use requires formal
medical review as well as the authentication, privacy and authorization work
described in the architecture. This change adds no scenario or clinical rule.
