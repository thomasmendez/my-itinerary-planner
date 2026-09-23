# Evals

Manual eval checklist for `app/chat/` + `app/mcp/server.py`. Used to evaluate the outputs of AI models given the MCP server tooling.

## Layout

- `checklist.md` — the test cases and grading criteria (what's checked, how it's scored)
- `run_mcp_eval.sh` — fires the checklist's cases at a running backend
- `results/<model-slug>.md` — one run log per model tested, e.g. `results/claude-haiku-4-5.md`

## Tested Providers

The following two providers have been tested and evaluated so far:

| Driver | `CHAT_PROVIDER` | Model | Notes |
|---|---|---|---|
| Claude | `anthropic` | `claude-haiku-4-5-20251001` (default) | Needs `ANTHROPIC_API_KEY` |
| Local | `ollama` | `gemma4:e2b` (default) | Needs `OLLAMA_BASE_URL` reachable; `qwen3:8b`/`4b` were too slow on CPU to finish a multi-round tool loop, per `.env.example` |

## Setup

Run the python backend, not via `docker compose` — this is an iterative loop of
editing prompts against a model (edit `.env` → restart → run 3 prompts →
repeat). If using Ollama, use `OLLAMA_BASE_URL=http://localhost:11434`

Leave `SERPAPI_KEY` blank. The dev fixture (`search/adapters/serpapi_stub.py`)
is free, has no rate limit, and it is deterministic: the same fixed set of flights/hotels/events every run, so
"did the model pick the cheapest one" has one right answer instead of
drifting with live prices. It only matches one exact param set per search
type though, so the cases in `checklist.md` are written to match it exactly.
Any other search params raise a "not configured" error instead of real
results.

1. Edit `backend/.env`: set `CHAT_PROVIDER` to the driver under test (plus
   its key/URL — see `.env.example`). Leave `CHAT_MODEL` blank to use the
   provider default above, and `SERPAPI_KEY` blank per above.
1a. Make sure the target db is actually migrated:
   `uv run alembic upgrade head` (from `backend/`). Skip this only if
   the app already runs normally on this machine and the tables exist.
   A never-migrated `sqlite:///./itinerary.db` fails every request with
   `sqlite3.OperationalError: no such table: trips` — this is the most
   common first-run error on a machine that's never run the backend before.
   (`ISOLATED=1` below does this step automatically, every run.)
2. Restart the backend (`--env-file .env` is read at process start, not
   per-request): `uv run --env-file .env uvicorn app.main:app --host 127.0.0.1 --port 8010 --reload`.
   The explicit `--port 8010` matters — `run_mcp_eval.sh` defaults to
   `http://127.0.0.1:8010` too (both `BASE_URL` and `ISOLATED=1`'s `PORT`),
   so the two agree with no extra flags needed. Plain
   `uvicorn app.main:app --reload` binds `8000` instead, which is why the
   script fails with "Failed to connect ... port 8010" against a
   backend that's actually up on `8000`.
3. Drive it via `POST /api/chat` directly, not the frontend UI — the
   response body (`{"messages": [...]}`, see `chat/router.py`) is the full
   provider-native turn history, tool calls and exact arguments included.
   That's what's needed to grade a case; the UI only shows the summarized
   chat bubble. `CURL_TIMEOUT=200 ISOLATED=0 ./run_mcp_eval.sh` (repo root) does this automatically — see
   below.
4. Have at least one trip created (case 1) before running cases that
   reference a `trip_id`.

### Running it: `run_mcp_eval.sh`

`./run_mcp_eval.sh [case ...]` fires the exact requests below at a backend
and prints each case's tool-call trace + final text for manual grading. It
handles trip creation, chaining, and both wire formats (Anthropic content
blocks vs. OpenAI-compatible `tool_calls`), so the same script works
unmodified against any `CHAT_PROVIDER`. curl + system `python3` only — no
venv, no jq.

**`ISOLATED=1` is the default** — the script never touches the real
`itinerary.db` unless overridden. It migrates a throwaway SQLite file (via
`DATABASE_URL` override, same trick as step 1a below, just automated),
starts a backend against it on `PORT` (default 8010) using
`backend/.env` as-is for `CHAT_PROVIDER`/keys/model, runs the requested
cases, then kills that backend and deletes the scratch db — pass, fail, or
Ctrl-C. This also means a first-time run on a fresh machine can't hit the
"no such table" error from an unmigrated db (see Errors below):

```
./run_mcp_eval.sh                                # all cases, isolated (default)
REPS=1 ./run_mcp_eval.sh 5 10                    # just these, isolated
PORT=8011 REPS=3 ./run_mcp_eval.sh               # if 8010 is already in use
START_REP=2 REPS=3 ./run_mcp_eval.sh 8           # resume a slow run: redo just reps 2-3 of case 8
./run_mcp_eval.sh 2>&1 | tee eval_out.txt        # save the full run to a file too
```

Reps are independent (each makes its own trips, no state carried between
them), so a slow local model doesn't need to rerun from rep 1 after a
Ctrl-C — pick up with `START_REP`. Case results print to stdout and
setup/progress logs to stderr, so plain `> file` captures just the former and
`2>&1 | tee file` captures both while still showing progress live.

Set `ISOLATED=0` to instead drive a backend started manually (e.g.
against the real db, or a separate scratch one from the manual recipe below)
at `BASE_URL`:

```
ISOLATED=0 BASE_URL=http://127.0.0.1:8010 REPS=3 ./run_mcp_eval.sh
```

Env vars: `ISOLATED` (default `1`), `BASE_URL` (default
`http://127.0.0.1:8010`, ignored unless `ISOLATED=0`), `REPS` (default 3),
`START_REP` (default 1 — first rep to run, for resuming a partial run),
`CURL_TIMEOUT` (default 120s — raise further for a slow local/CPU model, and
raise `CHAT_TIMEOUT_SECONDS` in `backend/.env` to match — it's the backend's
own per-request timeout and the lower of the two wins. Budget per number of
tool round-trips the case needs, not a flat bump: a case whose prompt chains
two tool calls into one turn, like 5 or 7, means two-plus sequential model
inferences before any text comes back, so it needs roughly that multiple of a
single-tool-call case's latency. On slow CPU-only hardware, curl giving up
doesn't stop the backend — it keeps running the abandoned request in the
background, so a too-low timeout produces a false FAIL, not a clean one; the
`mcp_eval_server.log` under `${TMPDIR:-/tmp}` still shows the true outcome),
`PORT` (default 8010, `ISOLATED=1` only).

Running with the *same* prompts across drivers (rather than paraphrasing per
model) is the point — it isolates whether tool-selection quality differs
between models rather than between prompt wordings. See `checklist.md`'s
Test cases table for the exact request per case (`trip_id`, setup, and
message(s) sent, in order) along with what each case is actually checking
and how to grade it.
