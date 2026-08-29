# Citizen Report — Nuisance Reporting Service

Backend for the mobile app. Receives civic-nuisance reports (illegal garbage
dumping, noise nuisance, loud biker gang, accident, illegal barbecue, bear
sighting), stores them, and correlates related reports — posting a map to X and
tagging local police when a meaningful pattern is found. Built for Japan first.

## Architecture (clean / ports & adapters)

```
src/
  domain/          Pure business logic (no I/O): geo math, travel feasibility,
                   dedupe, correlation, post-text composition, issue types.
  application/     Use cases (SubmitReport, ProcessReport) + ports (interfaces)
                   and tunable config. Depends only on domain + ports.
  infrastructure/  Adapters implementing the ports:
                     repositories/  InMemory, Postgres (RDS), DynamoDB
                     images/        S3 (+ in-memory)
                     social/        X/Twitter (+ recording fake)
                     map/           Static map renderer (+ fake)
                     police/        Japan prefectural directory
                     auth/          API-key authenticator
  interfaces/http/ Express app + bearer-auth middleware.
  composition/     The only place that wires concrete adapters together.
```

Dependencies point inward (interfaces → application → domain). Nothing in
`domain`/`application` imports a concrete adapter, so backends are swappable by
changing only the composition root.

### Swapping persistence: RDS today, DynamoDB later

`ReportRepository` is the single persistence port. Three implementations ship:
`InMemoryReportRepository`, `PostgresReportRepository` (Amazon RDS), and
`DynamoReportRepository`. The default is Postgres when `DATABASE_URL` is set,
otherwise in-memory. Switching to DynamoDB is a composition-root change only — no
use-case or domain code changes — because exact geo/time filtering lives in the
domain layer and each adapter only needs an issue-type + bounding-box + time
prefilter.

## Correlation rules

- **Loud biker gang (movement):** on a new sighting, find earlier biker-gang
  reports within a search radius (default 20 km) whose observation times are
  consistent with a single group physically travelling between the two points
  (`distance <= maxSpeed * elapsed`, default 80 km/h). On a match, render a map of
  the route and post to X, tagging the local police handle.
- **Garbage dumping / other stationary types (colocation):** when two or more
  reports of the same type land at effectively the same location (default 50 m),
  correlate them, render a map of the points, and post to X.
- **Duplicates:** a report from the same device, same issue type, same location
  (default 30 m) within the dedupe window is silently discarded.

All thresholds live in `application/config.ts`.

## Running

```bash
npm run dev -w service          # in-memory storage, port 4000
```

With Postgres (RDS parity):

```bash
bash service/scripts/setup-db.sh   # optional: provision local Postgres
REPORT_BACKEND=postgres \
  DATABASE_URL=postgres://citizen:citizen@127.0.0.1:5432/citizen_report \
  npm run dev -w service
```

### Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `SERVICE_PORT` | `4000` | HTTP port |
| `REPORT_BACKEND` | `postgres` if `DATABASE_URL` else `memory` | Persistence backend |
| `DATABASE_URL` | – | Postgres/RDS connection string |
| `API_TOKENS` | `dev-mobile-token:dev-mobile-app` | `token:clientId` pairs, comma-separated |
| `STATIC_MAP_URL` | – | Static-map provider URL; enables real map rendering |
| `COUNTRY` | `JP` | Country tag stored on reports |

The X poster and map renderer default to safe fakes (the fake poster logs what it
would post) until real credentials/URLs are configured.

## API

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | – | Health check |
| `GET` | `/api/v1/issue-types` | – | List issue types |
| `POST` | `/api/v1/reports` | Bearer + `X-Device-Id` | Submit a report |

`POST /api/v1/reports` body: `{ issueType, latitude, longitude, note?, observedAt?, photoBase64?, photoContentType? }`.
Responses: `201` accepted (with correlation summary), `202` duplicate_discarded,
`400` invalid, `401` unauthorized.

## Tests

```bash
npm run test -w service               # unit + use-case + HTTP tests (no DB)
npm run test:integration -w service   # Postgres adapter (needs DATABASE_URL)
```
