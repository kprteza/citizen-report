# Citizen Report

A civic issue–reporting platform for residents to report local problems and track
them to resolution. The repository contains four parts:

- **`mobile/`** — Cross-platform (iOS + Android) Expo / React Native app for
  reporting civic nuisances (illegal garbage dumping, noise, biker gangs,
  accidents, illegal barbecues, bear sightings) with location and optional photo.
- **`service/`** — Clean-architecture backend for the mobile app (Express + ports
  & adapters). Stores reports (RDS/Postgres, swappable to DynamoDB), correlates
  related reports, and posts a map to X tagging local police. Japan-first.
- **`server/`** — Express + TypeScript REST API backed by SQLite (`better-sqlite3`)
  for the web view.
- **`client/`** — React + Vite + TypeScript single-page web app with a modern UI.

`server`, `client`, and `service` form an npm workspaces monorepo; `mobile` is a
standalone Expo package (its own dependencies). See `service/README.md` and
`mobile/README.md` for details.

## Requirements

- Node.js >= 20 (developed on Node 22)
- npm >= 10

## Getting started

```bash
npm ci            # install all workspace dependencies
npm run dev       # start API (http://localhost:3001) and web app (http://localhost:5173)
```

`npm run dev` runs both dev servers together. You can also run them separately:

```bash
npm run dev:server   # API only, on port 3001
npm run dev:client   # Vite dev server only, on port 5173 (proxies /api to the API)
```

Open http://localhost:5173 in your browser. The API auto-creates a local SQLite
database at `server/data/citizen-report.db` and seeds a few sample reports on first run.

## Common commands

| Command | Description |
| --- | --- |
| `npm run dev` | Run API and web dev servers together |
| `npm run build` | Type-check and build both server and client for production |
| `npm run typecheck` | Type-check both workspaces |
| `npm run lint` | Lint both workspaces (ESLint) |
| `npm run test` | Run the server API test suite (`node:test`) |
| `npm start` | Run the compiled API from `server/dist` (after `npm run build`) |

## API overview

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/reports` | List reports (optional `?status=` and `?category=` filters) |
| `GET` | `/api/reports/:id` | Fetch a single report |
| `POST` | `/api/reports` | Create a report |
| `PATCH` | `/api/reports/:id/status` | Update a report's status |
| `GET` | `/api/stats` | Aggregate counts by status and category |

### Data model

A report has: `title`, `description`, `category` (`pothole` \| `streetlight` \|
`graffiti` \| `trash` \| `water` \| `other`), `severity` (`low` \| `medium` \|
`high`), `status` (`open` \| `in_progress` \| `resolved`), `address`, optional
`latitude`/`longitude`, and `reporter_name`.

### Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3001` | API port |
| `DB_FILE` | `data/citizen-report.db` | SQLite database path (`:memory:` for tests) |
| `VITE_API_TARGET` | `http://localhost:3001` | API target the Vite dev proxy forwards `/api` to |

## Cloud Agent environment

`.cursor/environment.json` configures the Cloud Agent dev environment: `npm ci`
installs dependencies, and two terminals (`api`, `web`) run the dev servers.
