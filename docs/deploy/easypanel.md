# Easypanel on a VPS

**Synthetic demonstration only. No real patient data or clinical validation.**
Current pages are public demo pages; role navigation provides no authorization.
The operator deploys this application; local verification does not verify the VPS.

## 1. Database

In an Easypanel project, select **New Service > Postgres**, name it `postgres`,
and use image `postgres:17` with persistent storage at `/var/lib/postgresql/data`.
Use generated credentials, start the service and wait for readiness. Leave external
exposure disabled. Under **Credentials**, copy the **internal connection URL**.
The App must be in the same project; use this hostname, never `localhost` or the
VPS IP. Keep a backup before each release and test restoration separately.

## 2. GitHub source and Dockerfile build

1. Select **New Service > App**, name it `health360`.
2. Under **Source > GitHub**, enter `leonardodesaboia/health360`. Select the
   reviewed release branch and record its commit SHA. Build Path is `/`.
   This public repository needs no read token. Disable Auto Deploy for a stable
   demo. Review the PR before release; this guide does not authorize merging it.
3. Select the **Dockerfile** builder: path `Dockerfile`, context repository root
   (`.`). Keep the default startup command. Overriding it with `next start` or
   `node server.js` bypasses migrations.
4. Supply no database URL or API key as build arguments. Compilation and Prisma
   generation need neither DB access nor a key. The image includes the locked
   Prisma CLI dependencies so it can migrate at startup.

## 3. Runtime environment

Set these under the App's **Environment**, then deploy to apply them:

```dotenv
DATABASE_URL=<internal Postgres connection URL from Credentials>
LLM_PROVIDER=mock
LLM_MODEL=deterministic-v1
LLM_TIMEOUT_MS=30000
PORT=3000
DEMO_COOKIE_SECURE=true
```

Leave `OPENAI_API_KEY` absent for the offline demo. `LLM_PROVIDER=mock` forces
mock even if a key is present. An unset provider also defaults to mock. It needs
no provider network access; Postgres is still required. The existing demonstrative
banner remains visible. Mock output is preliminary and requires physician review.

For a separately authorized live-provider session, set `LLM_PROVIDER=openai`,
`LLM_MODEL` to the chosen model (ADR0003 selects `gpt-6-astra`), and supply
`OPENAI_API_KEY` in Easypanel. Explicit OpenAI without a key/model is blocked;
API failures never fall back to mock. This deployment check makes no live OpenAI
request. Restore mock and redeploy before an offline demo.

`DATABASE_URL` and `OPENAI_API_KEY` stay server-only. Never use `NEXT_PUBLIC_*`
for secrets, commit `.env`, paste credentials into logs, or put them in client code.
Local `.env.example` credentials must not be used on the VPS.

## 4. Startup, migrations and health

Deploy after Postgres is ready. Each container starts with:

```sh
node node_modules/prisma/build/index.js migrate deploy
# Only after success:
node node_modules/next/dist/bin/next start --hostname 0.0.0.0
```

`migrate deploy` applies committed migrations and safely repeats on restart. A
failure exits before the web server starts. Look for `All migrations have been
successfully applied` or `No pending migrations to apply`, then Next.js readiness.
The DB user needs schema migration privileges. Startup performs no reset, `db push`,
`migrate dev`, automatic seed, or destructive database reinitialization. Never edit
applied migrations. Investigate failure and use a reviewed forward fix or tested
backup restoration; do not reset the database to make deployment pass.

Healthcheck: **GET `/api/health`**, container port **3000**. It runs `SELECT 1`
with 3-second connection/query timeouts and returns HTTP 200 `{"status":"ok"}`
or HTTP 503 `{"status":"unavailable"}`. It is uncached and returns no records,
secrets or error details. This is app/DB reachability, not clinical validation,
schema completeness or an OpenAI check. The Dockerfile includes interval 30s,
timeout 10s, startup grace 60s, three retries. Use the same path/timings in Easypanel
healthcheck settings if available. Unhealthy status alone does not guarantee a
restart; inspect logs and correct the cause.

## 5. Domain and HTTPS

In **Domains**, add the hostname with target port `3000` and path `/`. Point its
DNS A record to the VPS (AAAA only if IPv6 works). Allow ports 80/443 through the
firewall, enable HTTPS/certificate issuance in Easypanel, and verify the certificate
and HTTP-to-HTTPS redirect. Check `https://<demo-host>/api/health`, `/patient`, and
`/doctor`. Use HTTPS with `DEMO_COOKIE_SECURE=true`. Production always sets secure
session cookies, even when this flag is absent or false. Keep Postgres private.

## 6. Demo reset

No seed command is required: open `/patient` or `/doctor` and use **Choose demo
case** in the header to select a fictional patient. Selection creates the browser's
synthetic dataset. The patient and physician views share that demo session.

To rehearse again, click **Reset demo** in that same browser. It resets only that
session's selected stored case to its starting state, including removal of that
case's saved workflow records. Confirm the case is ready, then reload patient and
physician views. Other browser sessions remain separate. Selecting another case
also replaces this session's dataset, so save anything needed before switching.

Restarting the App preserves Postgres; clearing cookies does not delete stored
datasets. Never truncate tables, delete the volume, or use `prisma migrate reset`
for demo cleanup. The image omits source-level seed tooling; do not run an
unverified production seed command. Use only synthetic data.

## Local production image verification

PowerShell from the repository root; credentials below are disposable local-only.
Every test container is labeled for cleanup. Use unique names/network if these
already exist. No volume is mounted, so the verification DB is disposable.

```powershell
docker build -t health360-deploy .
docker network create health360-deploy-check
docker run -d --name health360-deploy-db --label "ao.session=$env:AO_SESSION_ID" --network health360-deploy-check -e POSTGRES_USER=health360 -e POSTGRES_PASSWORD=local_check_only -e POSTGRES_DB=health360 postgres:17
docker exec health360-deploy-db pg_isready -U health360 -d health360
# Wait for accepting connections before starting the app.
docker run -d --name health360-deploy-app --label "ao.session=$env:AO_SESSION_ID" --network health360-deploy-check -p 127.0.0.1:3241:3000 -e DATABASE_URL=postgresql://health360:local_check_only@health360-deploy-db:5432/health360 -e LLM_PROVIDER=mock health360-deploy
docker logs health360-deploy-app
Invoke-RestMethod http://127.0.0.1:3241/api/health
docker restart health360-deploy-app
# Wait for readiness; logs should now show no pending migrations.
docker logs health360-deploy-app
docker stop health360-deploy-db
# Health must now return 503. Restart DB and confirm recovery to 200.
docker start health360-deploy-db
# Cleanup only these disposable verification containers/network:
docker rm -f health360-deploy-app health360-deploy-db
docker network rm health360-deploy-check
```

## Pre-demo checklist (HISIC, November 3, 2026)

- Record the reviewed release commit; disable auto deploy during the demo.
- Verify persistent DB storage, internal connectivity and a restorable backup.
- Verify migration success, restart with no pending migrations, and health 200.
- Rehearse DB failure in staging: health 503, then recovery to 200.
- Force `LLM_PROVIDER=mock`, remove the key, redeploy and confirm startup.
- Verify DNS, HTTPS, redirect and secure cookies on the actual demo domain.
- Walk `/patient` and `/doctor` on desktop/mobile; confirm English-only UI and
  **DEMONSTRATIVE — NOT CLINICALLY VALIDATED** labels.
- Select a case, rehearse the implemented patient/physician flow, then use
  **Reset demo** and verify that only the current session returns to its starting state.
- Keep credentials out of screenshots; confirm no real patient data.
- Keep the previous working image/commit and DB backup. Check schema compatibility
  before rolling back an app image. Local checks do not verify VPS resources/TLS.

References: [Easypanel App service](https://easypanel.io/docs/services/app),
[Postgres service](https://easypanel.io/docs/services/postgres),
[Prisma migration workflows](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production).
