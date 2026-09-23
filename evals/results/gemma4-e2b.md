# Run log — Local (gemma4:e2b via ollama)

Test cases and grading criteria: `../checklist.md`.

| Date | Case # | Result | Notes |
|---|---|---|---|
| 2026-09-10 | 1 | PASS x3 | only cosmetic text differences |
| 2026-09-10 | 2 | PASS x3 | only cosmetic text differences |
| 2026-09-10 | 3 | PASS x3 | patch-only, destinations untouched |
| 2026-09-10 | 4 | PASS x3 | |
| 2026-09-10 | 5 | PASS x3 | correct cache_id/result_index reuse, saved $1650 all 3 reps |
| 2026-09-11 | 7 | FLAKY 9/10 | re-run at REPS=10 (not the standard 3x) to size a hallucination risk seen in this session's full sweep: `search_hotels` + `save_hotel_candidate` with accurate text in 9/10 reps. 1/10 (rep 7) called only `search_hotels` but the final text still claimed "I have saved ... as a candidate" — a write that never happened. This was a fast, complete response, not an abandoned request, so it isn't the `CURL_TIMEOUT` artifact noted below — a real model defect |
| 2026-09-10 | 8 | FLAKY 2/3 → fixed, PASS x3 | first attempt: 1/3 reps dumped all 10 unfiltered results instead of the networking-relevant subset. Root cause: `chat/service.py`'s ollama-only system prompt nudge said nothing about filtering search results to the request. Added that guidance (2026-09-10) and re-ran (2026-09-11): 3/3 correctly filtered |
| 2026-09-10 | 9 | PASS x3 | no tool call, pointed to custom-entry form |
| 2026-09-10 | 10 | PASS x3 (weak) | no hallucinated confirm tool (3/3), but asks "which trip/flight?" instead of stating confirmation is a UI action, unlike Claude's answer - passes the hard invariant, weaker text. No fix attempted; flagging only |
| 2026-09-11 | 11 | FLAKY 3/10 | re-run at REPS=10 after the "reword nudge to cover reads" fix (previously recorded as fixed at 3/3) to size the true flake rate. Result: 3/10 correctly reported the fetched calendar entries; 7/10 regressed to the original bug - most reps gave no text or a generic filler ("How can I help you with your trips, flights, hotels, or events today?"), and one rep instead echoed the system nudge back verbatim ("Understood. I will adhere to the following constraints: 1. ... 2. ... 3. ... 4. ...") rather than answering. The earlier 3/3 was a small-sample fluke, not a fix - true pass rate is closer to 30% |
| 2026-09-10 | 12 | PASS x3 | correct hotel_id resolved from conversation context; setup step's search+save (same prompt as case 7) also passed 3/3 here |
| 2026-09-10 | 13 | PASS x3 | unknown cache_id surfaced as plain-language error, nothing saved |

## Summary

**Known limitations, not release-reliable on turning a tool result into a
correct answer.** Tool selection and argument fidelity (cache_id/result_index
reuse, patch-only semantics, no hallucinated tools, correct id resolution
from context) match Claude 1:1 on every case, including case 5 and the write
half of cases 7/12 — this model picks the right tool with the right
arguments as reliably as Claude does. Where it breaks down, at n=10 reps
instead of the usual 3:

- **Read-only reporting (case 11) is unreliable: ~30% pass.** The
  `ollama`-only nudge in `chat/service.py` (`run_chat()`, ~line 220) that
  previously "fixed" this at 3/3 doesn't hold at a larger sample — most reps
  produce a generic offer-to-help, empty text, or (once) the model echoing
  the nudge's own wording back as a to-do list instead of applying it. Looks
  like a capability ceiling of the 2B edge model rather than a wording
  problem, since the nudge already spells out the read-vs-write distinction
  explicitly.
- **Claiming a save that didn't happen (case 7) is rare but real: 1/10.**
  One rep called only `search_hotels` yet still told the user the hotel was
  saved as a candidate — nothing was actually persisted. Worse per-incident
  than the read-reporting misses even though it's rarer, since it's a silent
  false claim about app state rather than a non-answer.
- Cases 1-5, 8-10, 12, 13 held at their original 3/3 from 2026-09-10 — no
  regression found outside the two read/write-reporting cases above.

No hardware available on hand to compare against a mid-size (7-9B) local
model. If that changes, re-run cases 7 and 11 at REPS=10 against it before
treating any local model as the documented reliable default — these two
failure modes, not tool selection, are the actual bar to clear.

Fill in one row per run (3 rows per case). Roll up a pass rate at the bottom
of each session so regressions across docstring edits are visible over time.
