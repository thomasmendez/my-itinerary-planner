from datetime import datetime

import httpx

from app.search.adapters.serpapi_stub import SerpApiNotConfiguredError
from app.search.models import SearchCache

FLIGHT_PARAMS = {"from": "sfo", "to": "jfk", "depart": "2026-06-22", "return": "", "travelers": 1}
FAKE_RESPONSE = {"best_flights": [{"price": 412.5, "airline": "United"}]}

HOTEL_PARAMS = {
    "location": "Bali Resorts", "checkIn": "2026-08-29", "checkOut": "2026-08-30", "guests": 2,
}
FAKE_HOTEL_RESPONSE = {
    "properties": [{"name": "The Pandawa Hills Ceningan", "rate_per_night": {"extracted_lowest": 17}}]
}

EVENTS_PARAMS = {
    "eventName": "Networking",
    "location": "Austin, Texas",
    "startDate": "2026-10-01",
    "endDate": "2026-10-01",
}
FAKE_EVENTS_RESPONSE = {"events_results": [{"title": "More Than Networking: Austin Business Mastermind"}]}

BOOKING_LINK_PARAMS = {
    "departure_id": "DAL",
    "arrival_id": "AUS",
    "outbound_date": "2026-09-06",
    "type": "2",
    "booking_token": "some-token",
}
FAKE_BOOKING_LINK_RESPONSE = {"url": "https://www.google.com/travel/clk/f", "post_data": "u=abc"}

RETURN_FLIGHTS_PARAMS = {
    "departure_id": "DAL",
    "arrival_id": "DEN",
    "outbound_date": "2026-11-01",
    "return_date": "2026-11-07",
    "departure_token": "some-departure-token",
}
FAKE_RETURN_FLIGHTS_RESPONSE = {"best_flights": [{"price": 302, "flights": [{"airline": "Southwest"}]}]}

HOTEL_BOOKING_LINK_PARAMS = {
    "property_token": "some-property-token",
    "location": "Bali Resorts",
    "check_in_date": "2026-09-06",
    "check_out_date": "2026-09-07",
    "adults": 2,
}
FAKE_HOTEL_BOOKING_LINK_RESPONSE = {
    "url": "https://www.hilton.com/en/hotels/dpsbahi-hilton-bali-resort/",
    "address": "Jl. Raya Nusa Dua Selatan, Benoa, Kec. Kuta Sel., Kabupaten Badung, Bali 80361, Indonesia",
}


def test_search_miss_calls_adapter_and_caches_result(client, db_session, monkeypatch):
    calls = []
    monkeypatch.setattr(
        "app.search.router.search_flights", lambda params: calls.append(params) or FAKE_RESPONSE
    )

    res = client.post("/api/search/flights", json=FLIGHT_PARAMS)

    assert res.status_code == 200
    assert res.json() == FAKE_RESPONSE
    assert len(calls) == 1
    assert db_session.query(SearchCache).count() == 1


def test_search_hit_skips_adapter_and_returns_cached_result(client, db_session, monkeypatch):
    calls = []
    monkeypatch.setattr(
        "app.search.router.search_flights", lambda params: calls.append(params) or FAKE_RESPONSE
    )

    client.post("/api/search/flights", json=FLIGHT_PARAMS)
    res = client.post("/api/search/flights", json=FLIGHT_PARAMS)

    assert res.status_code == 200
    assert res.json() == FAKE_RESPONSE
    assert len(calls) == 1  # adapter not called again on the cache hit


def test_search_expiry_matches_configured_ttl(client, db_session, monkeypatch):
    monkeypatch.setenv("SEARCH_CACHE_TTL_HOURS", "2")
    monkeypatch.setattr("app.search.router.search_flights", lambda params: FAKE_RESPONSE)

    client.post("/api/search/flights", json=FLIGHT_PARAMS)

    row = db_session.query(SearchCache).one()
    fetched_at = datetime.fromisoformat(row.fetched_at)
    expires_at = datetime.fromisoformat(row.expires_at)
    assert (expires_at - fetched_at).total_seconds() == 2 * 3600


def test_search_rejects_non_iso_depart_date(client):
    bad_params = {**FLIGHT_PARAMS, "depart": "June 22 2026"}
    res = client.post("/api/search/flights", json=bad_params)
    assert res.status_code == 422


def test_search_rejects_non_iso_return_date(client):
    bad_params = {**FLIGHT_PARAMS, "return": "06/29/2026"}
    res = client.post("/api/search/flights", json=bad_params)
    assert res.status_code == 422


def test_search_allows_blank_return_date(client, monkeypatch):
    monkeypatch.setattr("app.search.router.search_flights", lambda params: FAKE_RESPONSE)
    res = client.post("/api/search/flights", json=FLIGHT_PARAMS)
    assert res.status_code == 200


def test_search_returns_502_when_adapter_call_fails(client, monkeypatch):
    def raise_error(params):
        raise httpx.ConnectError("boom")

    monkeypatch.setattr("app.search.router.search_flights", raise_error)

    res = client.post("/api/search/flights", json=FLIGHT_PARAMS)

    assert res.status_code == 502
    assert res.json() == {"detail": "SerpApi request failed"}


def test_search_returns_503_when_serpapi_key_not_configured(client, monkeypatch):
    def raise_error(params):
        raise SerpApiNotConfiguredError("SERPAPI_KEY is not configured")

    monkeypatch.setattr("app.search.router.search_flights", raise_error)

    res = client.post("/api/search/flights", json=FLIGHT_PARAMS)

    assert res.status_code == 503
    assert "SERPAPI_KEY is not configured" == res.json()["detail"]


def test_booking_link_miss_calls_adapter_and_caches_result(client, db_session, monkeypatch):
    calls = []
    monkeypatch.setattr(
        "app.search.router.get_flight_booking_link",
        lambda params: calls.append(params) or FAKE_BOOKING_LINK_RESPONSE,
    )

    res = client.post("/api/search/flights/booking-link", json=BOOKING_LINK_PARAMS)

    assert res.status_code == 200
    assert res.json() == FAKE_BOOKING_LINK_RESPONSE
    assert len(calls) == 1
    assert db_session.query(SearchCache).count() == 1


def test_booking_link_hit_skips_adapter_and_returns_cached_result(client, db_session, monkeypatch):
    calls = []
    monkeypatch.setattr(
        "app.search.router.get_flight_booking_link",
        lambda params: calls.append(params) or FAKE_BOOKING_LINK_RESPONSE,
    )

    client.post("/api/search/flights/booking-link", json=BOOKING_LINK_PARAMS)
    res = client.post("/api/search/flights/booking-link", json=BOOKING_LINK_PARAMS)

    assert res.status_code == 200
    assert res.json() == FAKE_BOOKING_LINK_RESPONSE
    assert len(calls) == 1  # adapter not called again on the cache hit


def test_booking_link_rejects_non_iso_outbound_date(client):
    bad_params = {**BOOKING_LINK_PARAMS, "outbound_date": "September 6 2026"}
    res = client.post("/api/search/flights/booking-link", json=bad_params)
    assert res.status_code == 422


def test_booking_link_returns_502_when_adapter_call_fails(client, monkeypatch):
    def raise_error(params):
        raise httpx.ConnectError("boom")

    monkeypatch.setattr("app.search.router.get_flight_booking_link", raise_error)

    res = client.post("/api/search/flights/booking-link", json=BOOKING_LINK_PARAMS)

    assert res.status_code == 502
    assert res.json() == {"detail": "SerpApi request failed"}


def test_return_flights_miss_calls_adapter_and_caches_result(client, db_session, monkeypatch):
    calls = []
    monkeypatch.setattr(
        "app.search.router.get_return_flights",
        lambda params: calls.append(params) or FAKE_RETURN_FLIGHTS_RESPONSE,
    )

    res = client.post("/api/search/flights/return", json=RETURN_FLIGHTS_PARAMS)

    assert res.status_code == 200
    assert res.json() == FAKE_RETURN_FLIGHTS_RESPONSE
    assert len(calls) == 1
    assert db_session.query(SearchCache).count() == 1


def test_return_flights_hit_skips_adapter_and_returns_cached_result(client, db_session, monkeypatch):
    calls = []
    monkeypatch.setattr(
        "app.search.router.get_return_flights",
        lambda params: calls.append(params) or FAKE_RETURN_FLIGHTS_RESPONSE,
    )

    client.post("/api/search/flights/return", json=RETURN_FLIGHTS_PARAMS)
    res = client.post("/api/search/flights/return", json=RETURN_FLIGHTS_PARAMS)

    assert res.status_code == 200
    assert res.json() == FAKE_RETURN_FLIGHTS_RESPONSE
    assert len(calls) == 1  # adapter not called again on the cache hit


def test_return_flights_rejects_non_iso_return_date(client):
    bad_params = {**RETURN_FLIGHTS_PARAMS, "return_date": "November 7 2026"}
    res = client.post("/api/search/flights/return", json=bad_params)
    assert res.status_code == 422


def test_return_flights_returns_502_when_adapter_call_fails(client, monkeypatch):
    def raise_error(params):
        raise httpx.ConnectError("boom")

    monkeypatch.setattr("app.search.router.get_return_flights", raise_error)

    res = client.post("/api/search/flights/return", json=RETURN_FLIGHTS_PARAMS)

    assert res.status_code == 502
    assert res.json() == {"detail": "SerpApi request failed"}


def test_hotel_search_miss_calls_adapter_and_caches_result(client, db_session, monkeypatch):
    calls = []
    monkeypatch.setattr(
        "app.search.router.search_hotels", lambda params: calls.append(params) or FAKE_HOTEL_RESPONSE
    )

    res = client.post("/api/search/hotels", json=HOTEL_PARAMS)

    assert res.status_code == 200
    assert res.json() == FAKE_HOTEL_RESPONSE
    assert len(calls) == 1
    assert db_session.query(SearchCache).count() == 1


def test_hotel_search_hit_skips_adapter_and_returns_cached_result(client, db_session, monkeypatch):
    calls = []
    monkeypatch.setattr(
        "app.search.router.search_hotels", lambda params: calls.append(params) or FAKE_HOTEL_RESPONSE
    )

    client.post("/api/search/hotels", json=HOTEL_PARAMS)
    res = client.post("/api/search/hotels", json=HOTEL_PARAMS)

    assert res.status_code == 200
    assert res.json() == FAKE_HOTEL_RESPONSE
    assert len(calls) == 1  # adapter not called again on the cache hit


def test_hotel_search_rejects_non_iso_check_in_date(client):
    bad_params = {**HOTEL_PARAMS, "checkIn": "August 29 2026"}
    res = client.post("/api/search/hotels", json=bad_params)
    assert res.status_code == 422


def test_hotel_search_rejects_non_iso_check_out_date(client):
    bad_params = {**HOTEL_PARAMS, "checkOut": "not-a-date"}
    res = client.post("/api/search/hotels", json=bad_params)
    assert res.status_code == 422


def test_hotel_search_returns_502_when_adapter_call_fails(client, monkeypatch):
    def raise_error(params):
        raise httpx.ConnectError("boom")

    monkeypatch.setattr("app.search.router.search_hotels", raise_error)

    res = client.post("/api/search/hotels", json=HOTEL_PARAMS)

    assert res.status_code == 502
    assert res.json() == {"detail": "SerpApi request failed"}


def test_hotel_booking_link_miss_calls_adapter_and_caches_result(client, db_session, monkeypatch):
    calls = []
    monkeypatch.setattr(
        "app.search.router.get_hotel_booking_link",
        lambda params: calls.append(params) or FAKE_HOTEL_BOOKING_LINK_RESPONSE,
    )

    res = client.post("/api/search/hotels/booking-link", json=HOTEL_BOOKING_LINK_PARAMS)

    assert res.status_code == 200
    assert res.json() == FAKE_HOTEL_BOOKING_LINK_RESPONSE
    assert len(calls) == 1
    assert db_session.query(SearchCache).count() == 1


def test_hotel_booking_link_hit_skips_adapter_and_returns_cached_result(client, db_session, monkeypatch):
    calls = []
    monkeypatch.setattr(
        "app.search.router.get_hotel_booking_link",
        lambda params: calls.append(params) or FAKE_HOTEL_BOOKING_LINK_RESPONSE,
    )

    client.post("/api/search/hotels/booking-link", json=HOTEL_BOOKING_LINK_PARAMS)
    res = client.post("/api/search/hotels/booking-link", json=HOTEL_BOOKING_LINK_PARAMS)

    assert res.status_code == 200
    assert res.json() == FAKE_HOTEL_BOOKING_LINK_RESPONSE
    assert len(calls) == 1  # adapter not called again on the cache hit


def test_hotel_booking_link_rejects_non_iso_check_in_date(client):
    bad_params = {**HOTEL_BOOKING_LINK_PARAMS, "check_in_date": "September 6 2026"}
    res = client.post("/api/search/hotels/booking-link", json=bad_params)
    assert res.status_code == 422


def test_hotel_booking_link_returns_502_when_adapter_call_fails(client, monkeypatch):
    def raise_error(params):
        raise httpx.ConnectError("boom")

    monkeypatch.setattr("app.search.router.get_hotel_booking_link", raise_error)

    res = client.post("/api/search/hotels/booking-link", json=HOTEL_BOOKING_LINK_PARAMS)

    assert res.status_code == 502
    assert res.json() == {"detail": "SerpApi request failed"}


def test_events_search_miss_calls_adapter_and_caches_result(client, db_session, monkeypatch):
    calls = []
    monkeypatch.setattr(
        "app.search.router.search_events", lambda params: calls.append(params) or FAKE_EVENTS_RESPONSE
    )

    res = client.post("/api/search/events", json=EVENTS_PARAMS)

    assert res.status_code == 200
    assert res.json() == FAKE_EVENTS_RESPONSE
    assert len(calls) == 1
    assert db_session.query(SearchCache).count() == 1


def test_events_search_hit_skips_adapter_and_returns_cached_result(client, db_session, monkeypatch):
    calls = []
    monkeypatch.setattr(
        "app.search.router.search_events", lambda params: calls.append(params) or FAKE_EVENTS_RESPONSE
    )

    client.post("/api/search/events", json=EVENTS_PARAMS)
    res = client.post("/api/search/events", json=EVENTS_PARAMS)

    assert res.status_code == 200
    assert res.json() == FAKE_EVENTS_RESPONSE
    assert len(calls) == 1  # adapter not called again on the cache hit


def test_events_search_accepts_location_only(client, monkeypatch):
    calls = []
    monkeypatch.setattr(
        "app.search.router.search_events", lambda params: calls.append(params) or FAKE_EVENTS_RESPONSE
    )

    res = client.post("/api/search/events", json={"location": "Austin, Texas"})

    assert res.status_code == 200
    assert calls[0]["location"] == "Austin, Texas"
    assert calls[0]["eventName"] == "" and calls[0]["startDate"] == "" and calls[0]["endDate"] == ""


def test_events_search_rejects_missing_location(client):
    res = client.post("/api/search/events", json={k: v for k, v in EVENTS_PARAMS.items() if k != "location"})
    assert res.status_code == 422


def test_events_search_rejects_location_that_is_not_city_state(client):
    for location in ["", "Austin", "Austin,", ", Texas", "Austin, Texas, United States"]:
        res = client.post("/api/search/events", json={**EVENTS_PARAMS, "location": location})
        assert res.status_code == 422, location


def test_events_search_normalizes_location_whitespace(client, monkeypatch):
    calls = []
    monkeypatch.setattr(
        "app.search.router.search_events", lambda params: calls.append(params) or FAKE_EVENTS_RESPONSE
    )

    client.post("/api/search/events", json={"location": "  Austin ,Texas "})

    assert calls[0]["location"] == "Austin, Texas"


def test_events_search_rejects_non_iso_start_date(client):
    bad_params = {**EVENTS_PARAMS, "startDate": "October 1 2026"}
    res = client.post("/api/search/events", json=bad_params)
    assert res.status_code == 422


def test_events_search_rejects_non_iso_end_date(client):
    bad_params = {**EVENTS_PARAMS, "endDate": "not-a-date"}
    res = client.post("/api/search/events", json=bad_params)
    assert res.status_code == 422


def test_events_search_returns_502_when_adapter_call_fails(client, monkeypatch):
    def raise_error(params):
        raise httpx.ConnectError("boom")

    monkeypatch.setattr("app.search.router.search_events", raise_error)

    res = client.post("/api/search/events", json=EVENTS_PARAMS)

    assert res.status_code == 502
    assert res.json() == {"detail": "SerpApi request failed"}
