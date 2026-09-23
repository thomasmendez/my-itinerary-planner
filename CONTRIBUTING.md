# Contributing

- [Contribution policy](#contribution-policy)
- [Requirements](#requirements)
- [Development workflow](#development-workflow)
  - [One-time setup](#one-time-setup)
  - [Choosing a dev workflow](#choosing-a-dev-workflow)
    - [1. Frontend only](#1-frontend-only--ui-work-no-backend-running)
    - [2. Frontend + backend, no external calls](#2-frontend-reaches-backend-backend-uses-fixtures-for-returned-data-saveseditsdeletes-are-applied-to-db)
    - [3. Full end-to-end](#3-end-to-end-with-keys)
- [Test](#test)
  - [Backend tests](#backend-tests)
  - [Frontend tests](#frontend-tests)
  - [MCP tool testing](#mcp-tool-testing)
- [Structure](#structure)
  - [Modular monolith](#modular-monolith)
  - [Key invariants](#key-invariants)

## Contribution policy

This is currently a solo project, and **outside pull requests are not accepted at this time**. Pull
requests will be closed without review. This may change if the project grows.

You're welcome to:

- **Open an issue** for bug reports and feature requests. Issues are read, but
  there's no guaranteed response time.
- **Report security vulnerabilities privately**, as described in
  [`SECURITY.md`](SECURITY.md). Don't use public issues for these.
- **Modify your own copy** for non-competing use under the terms of
  [`LICENSE`](LICENSE). The rest of this document covers the development setup
  for that.

## Requirements

- Python 3.13 (3.12 is the minimum) and [uv](https://docs.astral.sh/uv/)
- Node 24 and npm

## Development workflow

### One-time setup

```sh
cd backend && uv sync && cp .env.example .env
cd ../frontend && npm ci && cp .env.example .env
```

Both `.env` files are gitignored — safe to fill in real keys without risking
a commit. The comments in each `.env.example` show which ones should be
applied for each workflow.

### Choosing a dev workflow

The frontend and backend each have their own independent variables to use
in development. Change the values based on each use case.

|  | Frontend (`VITE_MOCKING`) | Backend (`SERPAPI_KEY`) |
|---|---|---|
| **1. Frontend only** | `=true` -> mocked (MSW) | not running if `VITE_MOCKING=true` |
| **2. Frontend + backend, no external calls** | `=false` -> uses backend | blank -> uses fixtures |
| **3. Full end-to-end** | `=false` -> uses backend | set to your key -> makes SerpApi calls |

#### 1. Frontend only — UI work, no backend running

MSW intercepts API calls in the browser with fixture data.

```sh
cd frontend
npm run dev
```

`VITE_MOCKING=true` and `VITE_MOCK_TRIPS=true` are the defaults in
`.env.example`.

#### 2. Frontend reaches backend, backend uses fixtures for returned data. Saves/Edits/Deletes are applied to DB.

For working on the frontend and backend without needing a SerpApi key. This also uses the backend's search cache and TTL flow.

In `frontend/.env`, set:
```sh
VITE_MOCKING=false
VITE_MOCK_TRIPS=false
```

Leave `backend/.env`'s `SERPAPI_KEY` blank. Run both:
```sh
cd backend && uv run uvicorn app.main:app --reload
cd frontend && npm run dev
```

The backend logs a startup warning confirming it's running keyless
(`docker compose logs` shows the same warning).

Only the flight fixture's exact route/date
(`CDG→AUS`, `2026-07-30`) and hotel fixture's exact dates
(`2026-08-29`/`2026-08-30`) return populated results — everything else
returns an intentional empty response by design for this test case.

#### 3. End-to-end with keys

Fill in `backend/.env`'s `SERPAPI_KEY`, `ORS_API_KEY`, chat provider keys, keep `frontend/.env` on `VITE_MOCKING=false` /
`VITE_MOCK_TRIPS=false`, and run both servers. This is the same
config Docker uses in production, just with hot reload instead of a build.

## Test

### Backend tests

```sh
cd backend && uv run pytest
```

### Frontend tests

```sh
cd frontend && npx vitest run            # unit tests (npm run test starts watch mode)
cd frontend && npx playwright install chromium   # once, before the first e2e run
cd frontend && npm run test:e2e          # playwright
```

`test:e2e` starts its own frontend dev server on a separate port (see
`playwright.config.ts`) and forces `VITE_MOCKING` and `VITE_MOCK_TRIPS` to
`true`, whatever `frontend/.env` says. It doesn't need the backend.

### MCP tool testing

See `evals/README.md` for the MCP/chat eval harness.

## Structure

### Modular monolith

Each resource type has its own FastAPI module under `backend/app/`: `trips`,
`calendar`, `search`, `flights`, `rentals`, `hotels`, `events`, `map`, `chat`,
and `mcp`. Each module owns its `router.py`, `service.py`, and SQLAlchemy
models. Modules call each other only through service functions and never
access each other's tables directly.

The frontend (`frontend/src/`) is a standalone Vite SPA — `api/` for typed
fetch wrappers per module, `components/` for shared UI, `pages/` for the
trip/calendar/search views.

### Key invariants

- Only `backend/app/calendar/service.py` writes to `calendar_entries`. No
  other module writes to that table.
- Provider API responses are normalized before anything touches the database.
  Nothing becomes a saved or candidate item until the user explicitly saves it.
- Third-party API keys stay on the server. The React client never calls
  external APIs directly.
