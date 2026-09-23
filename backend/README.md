# Backend

API-only. See `frontend/README.md` to run the SPA alongside it.

## Installation Requirements

- [Python](https://www.python.org/) - version 3.12+
- [uv](https://docs.astral.sh/uv/) - version 0.12.5+

## Local Setup

### Setup Python Environment

Setup `uv` for managing the Python packages and project. 

`uv sync`
`uv venv`

### Setup .env

Copy the `.env.example` file and add the suggested keys

`cp .env.example .env`

*Note: All keys in `.env.example` are optional — leaving them blank falls back to dev
fixtures (search) or disables the feature (chat, map), so you can run the app
fully locally with no API keys. See the comments in `.env.example` for further configuration*

## Run Migrations

`uv run alembic upgrade head`

*Note: To add a new table, run `uv run alembic revision --autogenerate -m "create new table"`*


### Start App
`uv run --env-file .env uvicorn app.main:app --reload`

The API is now at `http://localhost:8000`, with interactive Swagger docs at
`http://localhost:8000/docs`.

## Run Tests

`uv run pytest`

## Lint

`uv run ruff check .`

## Connecting an AI Agent (MCP)

Ensure the app is running by having the app run with the steps above or via `docker-compose`

### Connect with Claude Code

In a terminal window, add the mcp server to the list of recognized mcp servers for Claude Code

```
claude mcp add --transport http itinerary-planner http://localhost:8000/mcp
```

Verify it connected with `claude mcp list`, or `/mcp` inside a Claude Code
session.

### Example prompt

Have Claude Code use the declared MCP server to use tools and functionality exposed in the backend for trip planning

```
Using the itinerary-planner MCP tools, create a trip called "Paris to Austin"
for 2026-07-28 to 2026-08-02, search flights from CDG to AUS departing
2026-07-30, and save the cheapest option as a candidate.
```

Claude Code will call `create_trip`, `search_flights`, and
`save_flight_candidate` on its own. The saved flight shows up as a candidate
in the app UI and on the trip's calendar — open it there to confirm or remove.

### Available tools

`list_trips`, `get_trip`, `create_trip`, `update_trip`, `delete_trip`,
`search_flights`, `save_flight_candidate`, `list_saved_flights`,
`remove_saved_flight`, `search_hotels`, `save_hotel_candidate`,
`list_saved_hotels`, `remove_saved_hotel`, `search_events`,
`save_event_candidate`, `list_events`, `remove_event`, `get_trip_calendar`,
`get_calendar`

No confirm/update tool is exposed for any saved-item type — confirming a
candidate stays a human action in the app UI, per the "no autonomous LLM
booking decisions" scope boundary.

## MCP tool testing

See `../evals/README.md` for the MCP/chat eval harness.
