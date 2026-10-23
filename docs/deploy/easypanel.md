# Easypanel on a VPS

**Synthetic demonstration only. No real patient data or clinical validation.**
Current routes are public demo pages; role navigation provides no authorization.
This runbook prepares deployment; it does not authorize real clinical use.

1. In an Easypanel project, create a PostgreSQL service using `postgres:17` and
   persistent storage. Keep it internal; use generated credentials, never the
   local `.env.example` defaults. Copy its internal connection URL.
2. Create an App service from this public GitHub repository and the chosen reviewed
   commit. Select the Dockerfile builder with context `.` and path `Dockerfile`.
3. Set runtime environment values in Easypanel: `DATABASE_URL` to the internal URL,
   `LLM_PROVIDER=openai`, `LLM_MODEL=gpt-6-astra` (configurable), `OPENAI_API_KEY`
   supplied by the user, `LLM_TIMEOUT_MS=30000` and `PORT=3000`. These integration
   values are reserved until P0-01/P0-06 implement their consumers. Keep secrets
   out of build arguments, repository files and `NEXT_PUBLIC_*` variables.
4. Deploy the app. Route the domain to container port 3000 and enable HTTPS in
   Easypanel. Check `/patient` and `/doctor` and their demonstration labels.
5. P0-01 must add and document the migration/seed release step before persistence
   is used. There is no Prisma schema or migration command to run yet.

Local preparation: copy `.env.example` to `.env`, then `pnpm db:up` (Docker engine
required). `pnpm db:down` stops the service and preserves the named data volume.
Keep `DATABASE_URL` credentials consistent with the `POSTGRES_*` values; password
changes do not reinitialize an existing volume. Prisma is not installed by this task.
For a local image check: `docker build -t health360 .`, then
`docker run --rm --label ao.session=manual -p 127.0.0.1:3000:3000 health360`.
No environment file or API key is needed to build the current foundation.

References: [App service](https://easypanel.io/docs/services/app),
[Postgres service](https://easypanel.io/docs/services/postgres),
[Next.js standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).
