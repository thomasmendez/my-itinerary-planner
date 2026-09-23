#!/usr/bin/env bash
# Fires the exact requests from checklist.md's "Test cases" table at
# a running backend and prints each case's tool-call trace + final text, for
# manual PASS/FAIL grading per checklist.md's "Grading" section. Same
# requests regardless of CHAT_PROVIDER/CHAT_MODEL in backend/.env, so runs
# against different drivers (e.g. anthropic vs. ollama) are apples-to-apples.
#
# Usage: ./run_mcp_eval.sh [case ...]      (default: all cases)
# Env:   ISOLATED (default 1) - spins up its own scratch-DB backend just for
#                 this run instead of hitting one you already have running,
#                 so the eval never touches your real itinerary.db. Uses
#                 backend/.env as normal for CHAT_PROVIDER/keys, only
#                 DATABASE_URL is overridden. Backend is migrated fresh and
#                 torn down (server killed, scratch db deleted) when the
#                 script exits, pass or fail. This is the default so a new
#                 user can't hit "no such table" from an unmigrated db or
#                 accidentally write test data into their real one - set
#                 ISOLATED=0 to instead drive a backend you started yourself.
#        BASE_URL (default http://127.0.0.1:8010) - ignored if ISOLATED=1
#        REPS (default 3 - checklist.md's "run each case 3x")
#        START_REP (default 1 - resume a slow run partway through, e.g.
#                 START_REP=2 REPS=3 ./run_mcp_eval.sh 8 to redo just rep 2-3
#                 of case 8. Each rep is already independent (own trips, no
#                 state carried over) so this is just where the loop starts.
#        CURL_TIMEOUT (default 120 - raise for a slow local model)
#        PORT (default 8010) - port for the ISOLATED=1 backend
#
# Needs: curl, python3 (stdlib only - no jq/venv required), and for the
# default ISOLATED=1, uv (already required to run the backend at all). With
# ISOLATED=0, point BASE_URL at a backend you started yourself - see
# README.md's Setup section for the manual scratch-DB/bare-uvicorn recipe
# ISOLATED=1 automates.
set -uo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8010}"
REPS="${REPS:-3}"
START_REP="${START_REP:-1}"
CURL_TIMEOUT="${CURL_TIMEOUT:-120}"
ISOLATED="${ISOLATED:-1}"
PORT="${PORT:-8010}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_PATH=""

cleanup() {
    if [ "$ISOLATED" = "1" ]; then
        pkill -f "uvicorn app.main:app --host 127.0.0.1 --port $PORT" 2>/dev/null
        [ -n "$DB_PATH" ] && rm -f "$DB_PATH" "$DB_PATH-wal" "$DB_PATH-shm"
    fi
}
trap cleanup EXIT

curl_json() { curl -sS --max-time "$CURL_TIMEOUT" "$@"; }

post() { curl_json -X POST "$BASE_URL$1" -H 'Content-Type: application/json' -d "$2"; }
patch() { curl_json -X PATCH "$BASE_URL$1" -H 'Content-Type: application/json' -d "$2" >/dev/null; }

# chat <messages-json> [trip_id] -> prints response "messages" array (json).
# A non-2xx /api/chat response has no "messages" key (it's {"detail": "..."}
# per chat/router.py) - surface that as a synthetic assistant message instead
# of crashing, so one failed rep (an Ollama timeout, a broken db, etc.)
# doesn't kill the rest of the run.
chat() {
    local messages="$1" trip_id="${2:-}"
    post "/api/chat" "$(python3 -c '
import json, sys
messages, trip_id = json.loads(sys.argv[1]), sys.argv[2]
print(json.dumps({"messages": messages, "trip_id": int(trip_id) if trip_id else None}))
' "$messages" "$trip_id")" | python3 -c '
import json, sys
raw = sys.stdin.read()
try:
    data = json.loads(raw)
except ValueError:
    print("[chat() error] non-JSON response: {}".format(raw[:300]), file=sys.stderr)
    print(json.dumps([{"role": "assistant", "content": "[HTTP ERROR] non-JSON response: {}".format(raw[:200])}]))
    sys.exit()
if "messages" not in data:
    print("[chat() error] {}".format(data), file=sys.stderr)
    print(json.dumps([{"role": "assistant", "content": "[HTTP ERROR] {}".format(data.get("detail", data))}]))
else:
    print(json.dumps(data["messages"]))
'
}

human() { python3 -c 'import json,sys; print(json.dumps([{"role":"user","content":sys.argv[1]}]))' "$1"; }
append() { python3 -c 'import json,sys; m=json.loads(sys.argv[1]); m.append({"role":"user","content":sys.argv[2]}); print(json.dumps(m))' "$1" "$2"; }

new_trip() { # <name> -> id
    post "/api/trips" "$(python3 -c 'import json,sys; print(json.dumps({"name":sys.argv[1],"destinations":[],"travelers":[]}))' "$1")" \
        | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])'
}

# show <label> <messages-json> -> prints tool calls + text, oldest to newest.
# Handles both wire formats: Anthropic (content = list of typed blocks) and
# OpenAI-compatible / openai+ollama (content = string, tool_calls = list).
show() {
    echo "--- $1 ---"
    python3 -c '
import json, sys
for m in json.loads(sys.argv[1]):
    if m.get("role") != "assistant":
        continue
    content = m.get("content")
    if isinstance(content, list):
        for b in content:
            if b.get("type") == "tool_use":
                print("  tool_call: {}({})".format(b["name"], json.dumps(b["input"])))
            elif b.get("type") == "text" and b.get("text"):
                print("  text: {}".format(b["text"]))
    else:
        for c in m.get("tool_calls") or []:
            fn = c["function"]
            print("  tool_call: {}({})".format(fn["name"], fn["arguments"]))
        if content:
            print("  text: {}".format(content))
' "$2"
}

case_1() { for ((r=START_REP; r<=REPS; r++)); do
    show "case 1 rep $r" "$(chat "$(human "Create a trip called Tokyo Fall 2026")")"
done; }

case_2() { for ((r=START_REP; r<=REPS; r++)); do
    show "case 2 rep $r" "$(chat "$(human "What trips do I have?")")"
done; }

case_3() { for ((r=START_REP; r<=REPS; r++)); do
    local tid; tid=$(new_trip "Rome Trip r$r")
    patch "/api/trips/$tid" '{"destinations":["FCO"]}'
    show "case 3 rep $r (trip $tid)" "$(chat "$(human "Set this trip's end date to 2026-11-10, don't touch anything else.")" "$tid")"
done; }

case_4_5() { for ((r=START_REP; r<=REPS; r++)); do
    local tid msgs1; tid=$(new_trip "Flight Test r$r")
    msgs1=$(chat "$(human "Find flights from CDG to AUS departing 2026-07-30, one-way, 1 traveler.")" "$tid")
    show "case 4 rep $r (trip $tid)" "$msgs1"
    show "case 5 rep $r (trip $tid)" "$(chat "$(append "$msgs1" "Save the cheapest one as a candidate on this trip.")" "$tid")"
done; }

case_7() { for ((r=START_REP; r<=REPS; r++)); do
    local tid; tid=$(new_trip "Hotel Test r$r")
    show "case 7 rep $r (trip $tid)" "$(chat "$(human "Find hotels in Bali Resorts, check-in 2026-08-29, check-out 2026-08-30, 2 guests, and save the cheapest one as a candidate on this trip.")" "$tid")"
done; }

case_8() { for ((r=START_REP; r<=REPS; r++)); do
    show "case 8 rep $r" "$(chat "$(human "Find Networking events in Austin, Texas, 2026-10-01 to 2026-10-01.")")"
done; }

case_9() { for ((r=START_REP; r<=REPS; r++)); do
    show "case 9 rep $r" "$(chat "$(human "Find me a rental car in Austin for next week.")")"
done; }

case_10() { for ((r=START_REP; r<=REPS; r++)); do
    local tid; tid=$(new_trip "Confirm Test r$r")
    chat "$(human "Find flights from CDG to AUS departing 2026-07-30, one-way, 1 traveler, and save the first result as a candidate on this trip.")" "$tid" >/dev/null
    show "case 10 rep $r (trip $tid)" "$(chat "$(human "Confirm that flight candidate for me.")" "$tid")"
done; }

case_11() { for ((r=START_REP; r<=REPS; r++)); do
    local tA tB t; tA=$(new_trip "Agg A r$r"); tB=$(new_trip "Agg B r$r")
    for t in "$tA" "$tB"; do
        chat "$(human "Find flights from CDG to AUS departing 2026-07-30, one-way, 1 traveler, and save the first result as a candidate on this trip.")" "$t" >/dev/null
    done
    show "case 11 rep $r (trips $tA,$tB)" "$(chat "$(human "What's on my calendar between 2026-07-01 and 2026-08-15, across all my trips?")")"
done; }

case_12() { for ((r=START_REP; r<=REPS; r++)); do
    local tid setup; tid=$(new_trip "Remove Test r$r")
    setup=$(chat "$(human "Find hotels in Bali Resorts, check-in 2026-08-29, check-out 2026-08-30, 2 guests, and save the cheapest one as a candidate on this trip.")" "$tid")
    show "case 12 setup rep $r (trip $tid)" "$setup"
    show "case 12 rep $r (trip $tid)" "$(chat "$(append "$setup" "Remove that hotel candidate.")" "$tid")"
done; }

case_13() { for ((r=START_REP; r<=REPS; r++)); do
    local tid; tid=$(new_trip "Bad Cache r$r")
    show "case 13 rep $r (trip $tid)" "$(chat "$(human "Save flight result index 2 using cache_id 999999 as a candidate on this trip.")" "$tid")"
done; }

ALL_CASES=(1 2 3 4_5 7 8 9 10 11 12 13)

if [ "$ISOLATED" = "1" ]; then
    BASE_URL="http://127.0.0.1:$PORT"
    if curl -sS -f --max-time 2 "$BASE_URL/api/trips" >/dev/null 2>&1; then
        echo "Something's already listening on $BASE_URL - pick a different PORT, or unset ISOLATED to use it as-is." >&2
        exit 1
    fi
    DB_PATH=$(mktemp -u /tmp/mcp_eval_XXXXXX.db)
    echo "ISOLATED=1: migrating scratch db at $DB_PATH ..." >&2
    if ! (cd "$SCRIPT_DIR/backend" && DATABASE_URL="sqlite:///$DB_PATH" uv run alembic upgrade head >&2); then
        echo "migration failed" >&2
        exit 1
    fi
    echo "ISOLATED=1: starting backend on $BASE_URL ..." >&2
    (cd "$SCRIPT_DIR/backend" && DATABASE_URL="sqlite:///$DB_PATH" uv run --env-file .env uvicorn app.main:app --host 127.0.0.1 --port "$PORT") \
        > "${TMPDIR:-/tmp}/mcp_eval_server.log" 2>&1 &
    for _ in $(seq 1 30); do
        curl -sS -f --max-time 1 "$BASE_URL/api/trips" >/dev/null 2>&1 && break
        sleep 1
    done
fi

# -f: a reachable-but-broken backend (e.g. a 500 from an unmigrated db) must
# fail this check too, not just an unreachable one - otherwise every case
# below silently fails one by one instead of a single clear error up front.
if ! curl -sS -f --max-time 5 "$BASE_URL/api/trips" >/dev/null 2>&1; then
    echo "Can't reach a healthy backend at $BASE_URL." >&2
    if [ "$ISOLATED" = "1" ]; then
        echo "(server failed to start - check ${TMPDIR:-/tmp}/mcp_eval_server.log)" >&2
    else
        echo "Is it running, and has 'uv run alembic upgrade head' been run against its db at least once?" >&2
        echo "See README.md's Setup section, or just re-run with ISOLATED=1 to skip this entirely." >&2
    fi
    exit 1
fi

cases=("$@")
[ ${#cases[@]} -eq 0 ] && cases=("${ALL_CASES[@]}")
for c in "${cases[@]}"; do
    "case_$c"
done
