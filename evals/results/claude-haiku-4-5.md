# Run log — Claude (claude-haiku-4-5-20251001)

Test cases and grading criteria: `../checklist.md`.

| Date | Case # | Result | Notes |
|---|---|---|---|
| 2026-09-10 | 1 | PASS x3 | |
| 2026-09-10 | 2 | PASS x3 | |
| 2026-09-10 | 3 | PASS x3 | patch-only, destinations untouched |
| 2026-09-10 | 4 | PASS x3 | |
| 2026-09-10 | 5 | PASS x3 | correct cache_id/result_index reuse, saved price $1650 all 3 reps |
| 2026-09-10 | 7 | PASS x3 | saved $17/night (cheapest) all 3 reps |
| 2026-09-10 | 8 | PASS x3 | first pass used end_date=2026-10-05 and silently hit the "not configured" fallback (auto-grader missed it since it only checked tool count); re-ran with end_date=2026-10-01 to match the fixture exactly - all 3 reps returned real event data |
| 2026-09-10 | 9 | PASS x3 | no tool call, pointed to custom-entry form |
| 2026-09-10 | 10 | PASS x3 | first-pass grader wrongly required zero tool calls and flagged a legitimate `list_saved_flights` lookup as a failure; re-graded on the real invariant (no confirm-shaped tool call) - held 3/3, text explicitly said confirmation happens in the UI |
| 2026-09-10 | 11 | PASS x3 | used `get_calendar` (aggregate), not per-trip |
| 2026-09-10 | 12 | PASS x3 | correct hotel_id resolved from conversation context |
| 2026-09-10 | 13 | PASS x3 | unknown cache_id surfaced as plain-language error, nothing saved |

## Summary

**12/12 cases, 36/36 reps passed.** Driven via a bare `uv run uvicorn`
process against an isolated scratch SQLite DB (`DATABASE_URL` override) and
the dev SerpApi fixture (`SERPAPI_KEY` blank) - no production data touched.
Two bugs were found and fixed in the eval harness itself during this run,
not in the app: case 8's prompt didn't match the fixture's exact-date
requirement, and case 10's auto-grader treated a legitimate
`list_saved_flights` lookup as a false failure. Both were corrected and
re-run before recording the rows above.

Fill in one row per run (3 rows per case). Roll up a pass rate at the bottom
of each session so regressions across docstring edits are visible over time.
