"""MCP tool tests.

Unlike the REST tests (conftest.py's `client` fixture, a FastAPI TestClient hitting
`/api/...` URLs), these drive the server through `mcp.client.Client` in-process
against the `MCPServer` instance directly - no HTTP socket, no streamable-http
session manager. That's the SDK's own recommended way to test a server (see the
`Client` docstring in mcp/client/client.py): it still goes through the real MCP
protocol (tool schemas, argument validation, the "call a tool by name" shape)
rather than calling the Python functions directly, the same way TestClient still
goes through the real ASGI/HTTP cycle instead of calling route functions directly.

Key difference from the REST tests: a router's HTTPException (404, 409, ...)
doesn't come back as a status code + `{"detail": ...}` body. It becomes a
`CallToolResult` with `is_error=True` and the message in `content[0].text` -
see `app/mcp/server.py`'s `_db()`, which re-raises HTTPException as ToolError
specifically so that detail reaches the client instead of a generic
"Error executing tool X".
"""

import json
from datetime import date, datetime, timedelta, timezone

import pytest
from mcp.client import Client
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.calendar.models import CalendarEntry
from app.database import Base
from app.mcp import server as mcp
from app.search.models import SearchCache

FLIGHT_ENTRY = {
    "flights": [
        {
            "departure_airport": {"id": "SFO", "time": "2026-06-22T08:00:00+00:00"},
            "arrival_airport": {"id": "JFK", "time": "2026-06-22T16:30:00+00:00"},
            "airline": "United",
        }
    ],
    "total_duration": 330,
    "price": 412.50,
}

HOTEL_ENTRY = {
    "type": "hotel",
    "name": "The Pandawa Hills Ceningan",
    "property_token": "ChoQxJaakviXiNqEARoNL2cvMTFrajVwaGRrdxAC",
    "gps_coordinates": {"latitude": -8.701930046081543, "longitude": 115.44574737548828},
    "rate_per_night": {"lowest": "$17", "extracted_lowest": 17},
    "overall_rating": 4.7,
}

EVENT_ENTRY = {
    "title": "Austin Business Mastermind",
    "type": "Business networking",
    "date": "Oct 1",
    "time": "3:00 PM",
    "address": ["Mama Betty's Tex-Mex - Burnet Rd", "Austin, TX"],
}


def _seed_flight_cache(db_session_factory, entries: list[dict] | None = None) -> int:
    """Stand in for a prior search_flights call: writes a search_cache row directly and
    returns its id, the same cache_id a real search_flights call would hand the agent."""
    with db_session_factory() as db:
        row = SearchCache(
            provider="test",
            params_hash="test-hash",
            response_json={"best_flights": entries or [FLIGHT_ENTRY], "other_flights": []},
            fetched_at=datetime.now(timezone.utc).isoformat(),
            expires_at=(datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return row.id


def _seed_hotel_cache(
    db_session_factory,
    entries: list[dict] | None = None,
    check_in: str = "2026-08-29",
    check_out: str = "2026-08-30",
) -> int:
    """Stand in for a prior search_hotels call - same shape as _seed_flight_cache, but
    including search_parameters' check_in_date/check_out_date since save_hotel_candidate
    reads the stay dates back out of those rather than making the agent re-type them."""
    with db_session_factory() as db:
        row = SearchCache(
            provider="test",
            params_hash="test-hotel-hash",
            response_json={
                "properties": entries or [HOTEL_ENTRY],
                "search_parameters": {"q": "Bali Resorts", "check_in_date": check_in, "check_out_date": check_out},
            },
            fetched_at=datetime.now(timezone.utc).isoformat(),
            expires_at=(datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return row.id


def _seed_event_cache(db_session_factory, entries: list[dict] | None = None) -> int:
    """Stand in for a prior search_events call - same shape as _seed_flight_cache."""
    with db_session_factory() as db:
        row = SearchCache(
            provider="test",
            params_hash="test-event-hash",
            response_json={"events_results": entries or [EVENT_ENTRY]},
            fetched_at=datetime.now(timezone.utc).isoformat(),
            expires_at=(datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return row.id


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
def db_session_factory(monkeypatch):
    """Fresh in-memory SQLite DB per test, same isolation as conftest's db_session
    fixture - but as a factory, since mcp/server.py opens its own Session per
    tool call via SessionLocal() rather than FastAPI dependency injection."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        dbapi_connection.execute("PRAGMA foreign_keys = ON")

    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine)
    monkeypatch.setattr(mcp, "SessionLocal", factory)
    return factory


async def _create_trip(client: Client, name: str = "NYC Trip") -> int:
    result = await client.call_tool("create_trip", {"name": name})
    return json.loads(result.content[0].text)["id"]


@pytest.mark.anyio
async def test_flights_tools_are_exposed_and_no_confirm_tool_exists(db_session_factory):
    async with Client(mcp.mcp_server) as client:
        tools = {t.name for t in (await client.list_tools()).tools}

    assert tools == {
        "list_trips",
        "get_trip",
        "create_trip",
        "update_trip",
        "delete_trip",
        "search_flights",
        "save_flight_candidate",
        "list_saved_flights",
        "remove_saved_flight",
        "search_hotels",
        "save_hotel_candidate",
        "list_saved_hotels",
        "remove_saved_hotel",
        "search_events",
        "save_event_candidate",
        "list_events",
        "remove_event",
        "get_trip_calendar",
        "get_calendar",
    }


@pytest.mark.anyio
async def test_create_trip_then_get_trip_round_trips(db_session_factory):
    async with Client(mcp.mcp_server) as client:
        trip_id = await _create_trip(client, "Denver Trip")

        result = await client.call_tool("get_trip", {"trip_id": trip_id})

    assert result.is_error is False
    body = json.loads(result.content[0].text)
    assert body["id"] == trip_id
    assert body["name"] == "Denver Trip"
    assert body["destinations"] == []


@pytest.mark.anyio
async def test_get_trip_missing_returns_tool_error_with_404_detail(db_session_factory):
    async with Client(mcp.mcp_server) as client:
        result = await client.call_tool("get_trip", {"trip_id": 999})

    assert result.is_error is True
    assert "Trip not found" in result.content[0].text


@pytest.mark.anyio
async def test_save_flight_candidate_persists_as_candidate_and_creates_calendar_entry(
    db_session_factory,
):
    cache_id = _seed_flight_cache(db_session_factory)

    async with Client(mcp.mcp_server) as client:
        trip_id = await _create_trip(client)

        result = await client.call_tool(
            "save_flight_candidate", {"trip_id": trip_id, "cache_id": cache_id, "result_index": 0}
        )
        assert result.is_error is False
        saved = json.loads(result.content[0].text)
        assert saved["status"] == "candidate"
        assert saved["source"] == "search"
        assert saved["trip_id"] == trip_id
        assert saved["origin"] == "SFO"
        assert saved["destination"] == "JFK"
        assert saved["airline"] == "United"
        assert saved["price"] == 412.50
        assert saved["raw_payload"] == FLIGHT_ENTRY

        listed = await client.call_tool("list_saved_flights", {"trip_id": trip_id})

    assert listed.structured_content["result"] == [saved]

    with db_session_factory() as db:
        entries = (
            db.query(CalendarEntry)
            .filter_by(source_type="saved_flight", source_id=saved["id"])
            .all()
        )
    assert len(entries) == 1
    assert entries[0].status == "candidate"
    assert entries[0].type == "flight_departure"


@pytest.mark.anyio
async def test_save_identical_flight_returns_tool_error_with_409_detail(db_session_factory):
    cache_id = _seed_flight_cache(db_session_factory)
    args = {"cache_id": cache_id, "result_index": 0}

    async with Client(mcp.mcp_server) as client:
        trip_id = await _create_trip(client)
        await client.call_tool("save_flight_candidate", {"trip_id": trip_id, **args})

        result = await client.call_tool("save_flight_candidate", {"trip_id": trip_id, **args})

    assert result.is_error is True
    assert "already saved" in result.content[0].text


@pytest.mark.anyio
async def test_save_flight_candidate_bad_result_index_returns_tool_error(db_session_factory):
    cache_id = _seed_flight_cache(db_session_factory)

    async with Client(mcp.mcp_server) as client:
        trip_id = await _create_trip(client)

        result = await client.call_tool(
            "save_flight_candidate", {"trip_id": trip_id, "cache_id": cache_id, "result_index": 5}
        )

    assert result.is_error is True
    assert "out of range" in result.content[0].text


@pytest.mark.anyio
async def test_save_flight_candidate_unknown_cache_id_returns_tool_error(db_session_factory):
    async with Client(mcp.mcp_server) as client:
        trip_id = await _create_trip(client)

        result = await client.call_tool(
            "save_flight_candidate", {"trip_id": trip_id, "cache_id": 999, "result_index": 0}
        )

    assert result.is_error is True
    assert "search again" in result.content[0].text


@pytest.mark.anyio
async def test_remove_saved_flight_deletes_it_and_its_calendar_entries(db_session_factory):
    cache_id = _seed_flight_cache(db_session_factory)

    async with Client(mcp.mcp_server) as client:
        trip_id = await _create_trip(client)
        saved = json.loads(
            (
                await client.call_tool(
                    "save_flight_candidate",
                    {"trip_id": trip_id, "cache_id": cache_id, "result_index": 0},
                )
            ).content[0].text
        )

        result = await client.call_tool(
            "remove_saved_flight", {"trip_id": trip_id, "flight_id": saved["id"]}
        )
        assert result.is_error is False

        listed = await client.call_tool("list_saved_flights", {"trip_id": trip_id})

    assert listed.structured_content["result"] == []
    with db_session_factory() as db:
        remaining = (
            db.query(CalendarEntry)
            .filter_by(source_type="saved_flight", source_id=saved["id"])
            .count()
        )
    assert remaining == 0


@pytest.mark.anyio
async def test_update_trip_changes_only_the_given_fields(db_session_factory):
    async with Client(mcp.mcp_server) as client:
        trip_id = await _create_trip(client, "Rome")
        await client.call_tool(
            "update_trip", {"trip_id": trip_id, "destinations": ["FCO"]}
        )

        result = await client.call_tool(
            "update_trip", {"trip_id": trip_id, "end_date": "2026-09-10"}
        )

    assert result.is_error is False
    body = json.loads(result.content[0].text)
    assert body["name"] == "Rome"
    assert body["destinations"] == ["FCO"]
    assert body["end_date"] == "2026-09-10"
    assert body["start_date"] is None


@pytest.mark.anyio
async def test_delete_trip_removes_it_and_cascades_to_saved_flights(db_session_factory):
    cache_id = _seed_flight_cache(db_session_factory)

    async with Client(mcp.mcp_server) as client:
        trip_id = await _create_trip(client)
        await client.call_tool(
            "save_flight_candidate", {"trip_id": trip_id, "cache_id": cache_id, "result_index": 0}
        )

        result = await client.call_tool("delete_trip", {"trip_id": trip_id})
        assert result.is_error is False

        missing = await client.call_tool("get_trip", {"trip_id": trip_id})

    assert missing.is_error is True
    assert "Trip not found" in missing.content[0].text


@pytest.mark.anyio
async def test_get_trip_calendar_returns_entries_for_that_trip(db_session_factory):
    cache_id = _seed_flight_cache(db_session_factory)

    async with Client(mcp.mcp_server) as client:
        trip_id = await _create_trip(client)
        await client.call_tool(
            "save_flight_candidate", {"trip_id": trip_id, "cache_id": cache_id, "result_index": 0}
        )

        result = await client.call_tool("get_trip_calendar", {"trip_id": trip_id})

    assert result.is_error is False
    entries = result.structured_content["result"]
    assert len(entries) == 1
    assert entries[0]["trip_id"] == trip_id
    assert entries[0]["type"] == "flight_departure"


@pytest.mark.anyio
async def test_get_calendar_aggregates_across_trips(db_session_factory):
    cache_id = _seed_flight_cache(db_session_factory)

    async with Client(mcp.mcp_server) as client:
        trip_a = await _create_trip(client, "Trip A")
        trip_b = await _create_trip(client, "Trip B")
        await client.call_tool(
            "save_flight_candidate", {"trip_id": trip_a, "cache_id": cache_id, "result_index": 0}
        )
        await client.call_tool(
            "save_flight_candidate", {"trip_id": trip_b, "cache_id": cache_id, "result_index": 0}
        )

        result = await client.call_tool("get_calendar", {})

    assert result.is_error is False
    entries = result.structured_content["result"]
    assert {e["trip_id"] for e in entries} == {trip_a, trip_b}


@pytest.mark.anyio
async def test_search_flights_returns_a_cache_id_and_summarized_results(db_session_factory, monkeypatch):
    # search_flights_route caches the provider's raw envelope (see search/adapters/serpapi.py);
    # the MCP tool hands back a cache_id plus lightweight summaries, not the raw envelope -
    # save_flight_candidate looks the full record back up by cache_id + result_index.
    fake_response = {"best_flights": [FLIGHT_ENTRY], "other_flights": []}
    calls = []
    monkeypatch.setattr(
        "app.search.router.search_flights", lambda params: calls.append(params) or fake_response
    )

    async with Client(mcp.mcp_server) as client:
        result = await client.call_tool(
            "search_flights", {"from_": "sfo", "to": "jfk", "depart": "2026-06-22"}
        )

    assert result.is_error is False
    body = json.loads(result.content[0].text)
    assert isinstance(body["cache_id"], int)
    assert body["results"] == [
        {
            "result_index": 0,
            "airline": "United",
            "origin": "SFO",
            "destination": "JFK",
            "outbound_departs_at": "2026-06-22T08:00:00+00:00",
            "outbound_arrives_at": "2026-06-22T16:30:00+00:00",
            "price": 412.50,
            "duration_minutes": 330,
            "stops": 0,
        }
    ]
    assert len(calls) == 1


@pytest.mark.anyio
async def test_search_hotels_returns_a_cache_id_and_summarized_results(db_session_factory, monkeypatch):
    fake_response = {
        "properties": [HOTEL_ENTRY],
        "search_parameters": {"check_in_date": "2026-08-29", "check_out_date": "2026-08-30"},
    }
    calls = []
    monkeypatch.setattr(
        "app.search.router.search_hotels", lambda params: calls.append(params) or fake_response
    )

    async with Client(mcp.mcp_server) as client:
        result = await client.call_tool(
            "search_hotels",
            {"location": "Bali Resorts", "check_in": "2026-08-29", "check_out": "2026-08-30", "guests": 2},
        )

    assert result.is_error is False
    body = json.loads(result.content[0].text)
    assert isinstance(body["cache_id"], int)
    assert body["results"] == [
        {
            "result_index": 0,
            "name": "The Pandawa Hills Ceningan",
            "price_per_night": 17,
            "rating": 4.7,
        }
    ]
    assert len(calls) == 1


@pytest.mark.anyio
async def test_save_hotel_candidate_persists_as_candidate_and_creates_calendar_entry(db_session_factory):
    cache_id = _seed_hotel_cache(db_session_factory)

    async with Client(mcp.mcp_server) as client:
        trip_id = await _create_trip(client)

        result = await client.call_tool(
            "save_hotel_candidate", {"trip_id": trip_id, "cache_id": cache_id, "result_index": 0}
        )
        assert result.is_error is False
        saved = json.loads(result.content[0].text)
        assert saved["status"] == "candidate"
        assert saved["source"] == "search"
        assert saved["trip_id"] == trip_id
        assert saved["name"] == "The Pandawa Hills Ceningan"
        assert saved["price_per_night"] == 17
        assert saved["rating"] == 4.7
        assert saved["check_in_date"] == "2026-08-29"
        assert saved["check_out_date"] == "2026-08-30"
        assert saved["latitude"] == -8.701930046081543
        assert saved["longitude"] == 115.44574737548828
        assert saved["raw_payload"] == {
            **HOTEL_ENTRY,
            "source": "search",
            "location": "Bali Resorts",
            "check_in_date": "2026-08-29",
            "check_out_date": "2026-08-30",
        }

        listed = await client.call_tool("list_saved_hotels", {"trip_id": trip_id})

    assert listed.structured_content["result"] == [saved]

    with db_session_factory() as db:
        entries = (
            db.query(CalendarEntry)
            .filter_by(source_type="saved_hotel", source_id=saved["id"])
            .all()
        )
    assert len(entries) == 1
    assert entries[0].status == "candidate"
    assert entries[0].type == "hotel"


@pytest.mark.anyio
async def test_save_identical_hotel_returns_tool_error_with_409_detail(db_session_factory):
    cache_id = _seed_hotel_cache(db_session_factory)
    args = {"cache_id": cache_id, "result_index": 0}

    async with Client(mcp.mcp_server) as client:
        trip_id = await _create_trip(client)
        await client.call_tool("save_hotel_candidate", {"trip_id": trip_id, **args})

        result = await client.call_tool("save_hotel_candidate", {"trip_id": trip_id, **args})

    assert result.is_error is True
    assert "already saved" in result.content[0].text


@pytest.mark.anyio
async def test_save_hotel_candidate_bad_result_index_returns_tool_error(db_session_factory):
    cache_id = _seed_hotel_cache(db_session_factory)

    async with Client(mcp.mcp_server) as client:
        trip_id = await _create_trip(client)

        result = await client.call_tool(
            "save_hotel_candidate", {"trip_id": trip_id, "cache_id": cache_id, "result_index": 5}
        )

    assert result.is_error is True
    assert "out of range" in result.content[0].text


@pytest.mark.anyio
async def test_save_hotel_candidate_unknown_cache_id_returns_tool_error(db_session_factory):
    async with Client(mcp.mcp_server) as client:
        trip_id = await _create_trip(client)

        result = await client.call_tool(
            "save_hotel_candidate", {"trip_id": trip_id, "cache_id": 999, "result_index": 0}
        )

    assert result.is_error is True
    assert "search again" in result.content[0].text


@pytest.mark.anyio
async def test_remove_saved_hotel_deletes_it_and_its_calendar_entries(db_session_factory):
    cache_id = _seed_hotel_cache(db_session_factory)

    async with Client(mcp.mcp_server) as client:
        trip_id = await _create_trip(client)
        saved = json.loads(
            (
                await client.call_tool(
                    "save_hotel_candidate",
                    {"trip_id": trip_id, "cache_id": cache_id, "result_index": 0},
                )
            ).content[0].text
        )

        result = await client.call_tool(
            "remove_saved_hotel", {"trip_id": trip_id, "hotel_id": saved["id"]}
        )
        assert result.is_error is False

        listed = await client.call_tool("list_saved_hotels", {"trip_id": trip_id})

    assert listed.structured_content["result"] == []
    with db_session_factory() as db:
        remaining = (
            db.query(CalendarEntry)
            .filter_by(source_type="saved_hotel", source_id=saved["id"])
            .count()
        )
    assert remaining == 0


@pytest.mark.anyio
async def test_search_events_returns_a_cache_id_and_summarized_results(db_session_factory, monkeypatch):
    fake_response = {"events_results": [EVENT_ENTRY]}
    calls = []
    monkeypatch.setattr(
        "app.search.router.search_events", lambda params: calls.append(params) or fake_response
    )

    async with Client(mcp.mcp_server) as client:
        result = await client.call_tool(
            "search_events",
            {
                "event_name": "Networking",
                "location": "Austin, Texas",
                "start_date": "2026-10-01",
                "end_date": "2026-10-01",
            },
        )

    assert result.is_error is False
    body = json.loads(result.content[0].text)
    assert isinstance(body["cache_id"], int)
    assert body["results"] == [
        {
            "result_index": 0,
            "title": "Austin Business Mastermind",
            "type": "Business networking",
            "date": "Oct 1",
            "time": "3:00 PM",
            "address": "Mama Betty's Tex-Mex - Burnet Rd, Austin, TX",
        }
    ]
    assert len(calls) == 1


@pytest.mark.anyio
async def test_save_event_candidate_persists_as_candidate_and_creates_calendar_entry(
    db_session_factory, monkeypatch
):
    # Fixes "today" so EVENT_ENTRY's year-less "Oct 1" resolves deterministically to 2026,
    # matching parse_serpapi_event_date's "roll forward if already passed" rule.
    class FixedDate(date):
        @classmethod
        def today(cls):
            return date(2026, 9, 1)

    monkeypatch.setattr(mcp, "date", FixedDate)
    cache_id = _seed_event_cache(db_session_factory)

    async with Client(mcp.mcp_server) as client:
        trip_id = await _create_trip(client)

        result = await client.call_tool(
            "save_event_candidate", {"trip_id": trip_id, "cache_id": cache_id, "result_index": 0}
        )
        assert result.is_error is False
        saved = json.loads(result.content[0].text)
        assert saved["status"] == "candidate"
        assert saved["source"] == "search"
        assert saved["trip_id"] == trip_id
        assert saved["name"] == "Austin Business Mastermind"
        assert saved["location"] == "Mama Betty's Tex-Mex - Burnet Rd, Austin, TX"
        assert saved["starts_at"] == "2026-10-01 15:00"
        assert saved["ends_at"] is None
        assert saved["price"] is None
        assert saved["raw_payload"] == EVENT_ENTRY

        listed = await client.call_tool("list_events", {"trip_id": trip_id})

    assert listed.structured_content["result"] == [saved]

    with db_session_factory() as db:
        entries = (
            db.query(CalendarEntry)
            .filter_by(source_type="event", source_id=saved["id"])
            .all()
        )
    assert len(entries) == 1
    assert entries[0].status == "candidate"
    assert entries[0].type == "event"


@pytest.mark.anyio
async def test_save_event_candidate_bad_result_index_returns_tool_error(db_session_factory):
    cache_id = _seed_event_cache(db_session_factory)

    async with Client(mcp.mcp_server) as client:
        trip_id = await _create_trip(client)

        result = await client.call_tool(
            "save_event_candidate", {"trip_id": trip_id, "cache_id": cache_id, "result_index": 5}
        )

    assert result.is_error is True
    assert "out of range" in result.content[0].text


@pytest.mark.anyio
async def test_save_event_candidate_unknown_cache_id_returns_tool_error(db_session_factory):
    async with Client(mcp.mcp_server) as client:
        trip_id = await _create_trip(client)

        result = await client.call_tool(
            "save_event_candidate", {"trip_id": trip_id, "cache_id": 999, "result_index": 0}
        )

    assert result.is_error is True
    assert "search again" in result.content[0].text


@pytest.mark.anyio
async def test_remove_event_deletes_it_and_its_calendar_entries(db_session_factory):
    cache_id = _seed_event_cache(db_session_factory)

    async with Client(mcp.mcp_server) as client:
        trip_id = await _create_trip(client)
        saved = json.loads(
            (
                await client.call_tool(
                    "save_event_candidate",
                    {"trip_id": trip_id, "cache_id": cache_id, "result_index": 0},
                )
            ).content[0].text
        )

        result = await client.call_tool(
            "remove_event", {"trip_id": trip_id, "event_id": saved["id"]}
        )
        assert result.is_error is False

        listed = await client.call_tool("list_events", {"trip_id": trip_id})

    assert listed.structured_content["result"] == []
    with db_session_factory() as db:
        remaining = (
            db.query(CalendarEntry)
            .filter_by(source_type="event", source_id=saved["id"])
            .count()
        )
    assert remaining == 0
