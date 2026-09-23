# MCP / Chat Tool-Selection Checklist

Test cases and grading for the eval described in `README.md` — see that file
for driver setup and how to run these against a live backend via
`run_mcp_eval.sh`.

## Grading

- **PASS** — correct tool(s) called, with arguments that match what the
  prompt asked for (right trip_id, right cache_id/result_index reused
  verbatim, right filters). Final text may be graded loosely — a reasonable
  summary is fine even if not word-perfect.
- **FAIL** — wrong tool, missing a required tool call, a hallucinated
  capability (e.g. inventing a rental-search tool), or reconstructing a
  saved item's fields by hand instead of reusing `cache_id`/`result_index`.
- Run each case **3x** per driver, record pass rate — single runs are noise
  at temperature > 0. A case that's flaky (e.g. 2/3) is a signal worth
  chasing even if not an outright fail.

## Test cases

`trip_id` is which trip_id (if any) the request carries; `Setup` is what
must exist in the DB beforehand, beyond what's already implied by `trip_id`
or created within `Prompt` itself.

| # | `trip_id` | Setup | Prompt | Expected tool trace | What it's actually checking |
|---|---|---|---|---|---|
| 1 | none | — | "Create a trip called Tokyo Fall 2026" | `create_trip(name=...)` | Basic tool selection, no over-eager extra calls |
| 2 | none | ≥1 trip exists | "What trips do I have?" | `list_trips()` | No hallucinated trips in the reply beyond what's returned |
| 3 | a trip with `destinations=["FCO"]` already set | — | "Set this trip's end date to 2026-11-10, don't touch anything else." | `update_trip(trip_id=..., end_date=...)` only | Model doesn't resend unrelated fields (PATCH-not-PUT semantics) |
| 4 | a fresh trip | — | "Find flights from CDG to AUS departing 2026-07-30, one-way, 1 traveler." | `search_flights(from_=CDG, to=AUS, depart=2026-07-30)` only, no save call | Matches the dev fixture (4 fares, $1650–$2242); doesn't save uninstructed; summary reflects returned price/airline/stops |
| 5 | same trip as 4, **chained onto case 4's reply** | run case 4 first, same conversation | + "Save the cheapest one as a candidate on this trip." | `save_flight_candidate(trip_id=..., cache_id=<from case 4>, result_index=<the $1650 fare>)` | **Highest-value case** — exact cache_id/result_index reuse, not a hand-copied record (this is the exact failure mode the docstring wording guards against) |
| 6 | — | — | *(dropped — round-trip search isn't in the dev fixture; would need a real `SERPAPI_KEY` to test)* | | |
| 7 | a fresh trip | — | "Find hotels in Bali Resorts, check-in 2026-08-29, check-out 2026-08-30, 2 guests, and save the cheapest one as a candidate on this trip." | `search_hotels(location="Bali Resorts", check_in=2026-08-29, check_out=2026-08-30, guests=2)` then `save_hotel_candidate(cache_id=..., result_index=<the $17/night one>)` | Matches the dev fixture (3 properties, $17/$130/$2917 — "top-rated" ties at 4.7, so ask for cheapest instead for an unambiguous answer); stay dates aren't re-typed by the model — server pulls them from the cache |
| 8 | none | — | "Find Networking events in Austin, Texas, 2026-10-01 to 2026-10-01." | `search_events(event_name="Networking", location="Austin, Texas", start_date=2026-10-01, end_date=2026-10-01)` | Only `location` is required; the dev fixture matches location "Austin, Texas" with event_name blank or "Networking" (dates don't affect matching). A different location still produces a *valid* tool call but misses the fixture and returns a "not configured" error instead of real results. |
| 9 | none | — | "Find me a rental car in Austin for next week." | **no tool call** (no search-rental tool exists) | Model doesn't hallucinate a tool; points user to the custom-entry form per `mcp_server`'s top-level instructions |
| 10 | a fresh trip | — (candidate is created by turn 1 of Prompt itself) | Turn 1 (separate conversation): "Find flights from CDG to AUS departing 2026-07-30, one-way, 1 traveler, and save the first result as a candidate on this trip." Turn 2 (**new, empty `messages`**, same `trip_id`): "Confirm that flight candidate for me." — deliberately relies on the saved candidate already being in the DB, not on chat history, since the case is testing whether the model invents a confirm tool with zero prior context | **no tool call** | Model correctly states confirming is done by the human in the UI, doesn't invent a confirm tool |
| 11 | none (aggregate) | two fresh trips, each given its own separate conversation with the case-4-style flight prompt (`trip_id` = that trip), so the window actually contains entries | Then a fresh conversation, no `trip_id`: "What's on my calendar between 2026-07-01 and 2026-08-15, across all my trips?" | `get_calendar(start=2026-07-01, end=2026-08-15)`, not `get_trip_calendar` | Picks the aggregate endpoint over the per-trip one when the prompt says "all trips" |
| 12 | a fresh trip | — (candidate is created by turn 1 of Prompt itself) | Turn 1: same hotel prompt as case 7. Turn 2, **chained onto turn 1's reply**: "Remove that hotel candidate." | `remove_saved_hotel(trip_id=..., hotel_id=...)` | Correct tool + correct id from context, not `delete_trip` or a no-op |
| 13 | a fresh trip | none (no real search this session) | "Save flight result index 2 using cache_id 999999 as a candidate on this trip." | tool call fails gracefully (`cache_id` unknown/expired) | Model surfaces the "search again" error to the user in plain language instead of fabricating a save |

## Run log

Results are per-model, not inline here — see `results/`:

| Model | Driver | File |
|---|---|---|
| Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) | `anthropic` | [`results/claude-haiku-4-5.md`](results/claude-haiku-4-5.md) |
| gemma4:e2b | `ollama` | [`results/gemma4-e2b.md`](results/gemma4-e2b.md) |

Add a new `results/<model-slug>.md` per model tested (copy the table
structure from an existing one). Fill in one row per run (3 rows per case).
Roll up a pass rate at the bottom of each session so regressions across
docstring edits are visible over time.
