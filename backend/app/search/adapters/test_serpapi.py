import pytest

from app.search.adapters.serpapi import (
    get_flight_booking_link,
    get_hotel_booking_link,
    get_return_flights,
    search_events,
    search_flights,
    search_hotels,
)
from app.search.adapters.serpapi_stub import (
    _STUB_BOOKING_TOKEN,
    _STUB_HOTEL_PROPERTY_TOKEN,
    _STUB_RETURN_DEPARTURE_TOKEN,
    SerpApiNotConfiguredError,
)


@pytest.fixture
def fake_serpapi(monkeypatch):
    """Fakes SerpApi's HTTP GET. Set ["json"] to the body to return; ["params"] holds the last query sent."""
    monkeypatch.setenv("SERPAPI_KEY", "test-key")
    call = {"json": {}}

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return call["json"]

    def fake_get(url, params=None, timeout=None):
        call["url"], call["params"] = url, params
        return FakeResponse()

    monkeypatch.setattr("app.search.adapters.serpapi.httpx.get", fake_get)
    return call


MATCHING_PARAMS = {"from": "cdg", "to": "aus", "depart": "2026-07-30", "return": "", "travelers": 1}
OTHER_PARAMS = {"from": "sfo", "to": "jfk", "depart": "2026-06-22", "return": "", "travelers": 1}

MATCHING_BOOKING_LINK_PARAMS = {
    "departure_id": "dal",
    "arrival_id": "aus",
    "outbound_date": "2026-09-06",
    "type": "2",
    "booking_token": _STUB_BOOKING_TOKEN,
}
OTHER_BOOKING_LINK_PARAMS = {**MATCHING_BOOKING_LINK_PARAMS, "booking_token": "not-the-right-token"}

MATCHING_ROUND_TRIP_BOOKING_LINK_PARAMS = {
    "departure_id": "dal",
    "arrival_id": "den",
    "outbound_date": "2026-11-01",
    "return_date": "2026-11-07",
    "type": "1",
    "booking_token": "stub-round-trip-booking-token",
}

# real DAL -> DEN round-trip search from trip #3 (Colorado)
MATCHING_RETURN_FLIGHTS_PARAMS = {
    "departure_id": "dal",
    "arrival_id": "den",
    "outbound_date": "2026-11-01",
    "return_date": "2026-11-07",
    "departure_token": _STUB_RETURN_DEPARTURE_TOKEN,
}
OTHER_RETURN_FLIGHTS_PARAMS = {**MATCHING_RETURN_FLIGHTS_PARAMS, "departure_token": "not-the-right-token"}

MATCHING_HOTEL_PARAMS = {"location": "Bali Resorts", "checkIn": "2026-08-29", "checkOut": "2026-08-30", "guests": 2}
OTHER_HOTEL_PARAMS = {"location": "Austin Hotels", "checkIn": "2026-06-22", "checkOut": "2026-06-23", "guests": 1}

MATCHING_HOTEL_BOOKING_LINK_PARAMS = {
    "property_token": _STUB_HOTEL_PROPERTY_TOKEN,
    "location": "Bali Resorts",
    "check_in_date": "2026-09-06",
    "check_out_date": "2026-09-07",
    "adults": 2,
}
OTHER_HOTEL_BOOKING_LINK_PARAMS = {**MATCHING_HOTEL_BOOKING_LINK_PARAMS, "property_token": "not-the-right-token"}

MATCHING_EVENTS_PARAMS = {
    "eventName": "Networking",
    "location": "Austin, Texas",
    "startDate": "2026-10-01",
    "endDate": "2026-10-01",
}
OTHER_EVENTS_PARAMS = {
    "eventName": "Music",
    "location": "Denver, Colorado",
    "startDate": "2026-11-05",
    "endDate": "2026-11-05",
}


def test_returns_the_fixture_for_the_one_matching_search(monkeypatch):
    monkeypatch.delenv("SERPAPI_KEY", raising=False)

    result = search_flights(MATCHING_PARAMS)

    assert len(result["best_flights"]) == 4
    leg = result["best_flights"][0]["flights"][0]
    assert leg["departure_airport"]["id"] == "CDG"


def test_raises_not_configured_error_for_any_other_search(monkeypatch):
    monkeypatch.delenv("SERPAPI_KEY", raising=False)

    with pytest.raises(SerpApiNotConfiguredError, match="SERPAPI_KEY"):
        search_flights(OTHER_PARAMS)


def test_omits_optional_filters_from_serpapi_query_when_left_at_default(monkeypatch):
    monkeypatch.setenv("SERPAPI_KEY", "test-key")
    captured = {}

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"best_flights": []}

    def fake_get(url, params=None, timeout=None):
        captured["params"] = params
        return FakeResponse()

    monkeypatch.setattr("app.search.adapters.serpapi.httpx.get", fake_get)

    search_flights(MATCHING_PARAMS)

    assert captured["params"]["show_hidden"] == "true"
    assert "travel_class" not in captured["params"]
    assert "sort_by" not in captured["params"]
    assert "stops" not in captured["params"]
    assert "max_price" not in captured["params"]


def test_includes_optional_filters_in_serpapi_query_when_set(monkeypatch):
    monkeypatch.setenv("SERPAPI_KEY", "test-key")
    captured = {}

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"best_flights": []}

    def fake_get(url, params=None, timeout=None):
        captured["params"] = params
        return FakeResponse()

    monkeypatch.setattr("app.search.adapters.serpapi.httpx.get", fake_get)

    search_flights({**MATCHING_PARAMS, "travel_class": 3, "sort_by": 2, "stops": 1, "max_price": 500})

    assert captured["params"]["travel_class"] == "3"
    assert captured["params"]["sort_by"] == "2"
    assert captured["params"]["stops"] == "1"
    assert captured["params"]["max_price"] == "500"


def test_hotels_returns_the_fixture_for_the_one_matching_search(monkeypatch):
    monkeypatch.delenv("SERPAPI_KEY", raising=False)

    result = search_hotels(MATCHING_HOTEL_PARAMS)

    assert len(result["properties"]) == 3
    property_ = result["properties"][0]
    assert property_["name"] == "The Pandawa Hills Ceningan"
    assert property_["rate_per_night"]["extracted_lowest"] == 17


def test_hotels_raises_not_configured_error_for_any_other_search(monkeypatch):
    monkeypatch.delenv("SERPAPI_KEY", raising=False)

    with pytest.raises(SerpApiNotConfiguredError, match="SERPAPI_KEY"):
        search_hotels(OTHER_HOTEL_PARAMS)


def test_hotels_omits_optional_filters_from_serpapi_query_when_unset(monkeypatch):
    monkeypatch.setenv("SERPAPI_KEY", "test-key")
    captured = {}

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"properties": []}

    def fake_get(url, params=None, timeout=None):
        captured["params"] = params
        return FakeResponse()

    monkeypatch.setattr("app.search.adapters.serpapi.httpx.get", fake_get)

    search_hotels(MATCHING_HOTEL_PARAMS)

    assert "sort_by" not in captured["params"]
    assert "min_price" not in captured["params"]
    assert "max_price" not in captured["params"]
    assert "rating" not in captured["params"]


def test_hotels_includes_optional_filters_in_serpapi_query_when_set(monkeypatch):
    monkeypatch.setenv("SERPAPI_KEY", "test-key")
    captured = {}

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"properties": []}

    def fake_get(url, params=None, timeout=None):
        captured["params"] = params
        return FakeResponse()

    monkeypatch.setattr("app.search.adapters.serpapi.httpx.get", fake_get)

    search_hotels({**MATCHING_HOTEL_PARAMS, "sort_by": 3, "min_price": 50, "max_price": 500, "rating": 8})

    assert captured["params"]["sort_by"] == "3"
    assert captured["params"]["min_price"] == "50"
    assert captured["params"]["max_price"] == "500"
    assert captured["params"]["rating"] == "8"


def test_events_returns_the_fixture_for_the_one_matching_search(monkeypatch):
    monkeypatch.delenv("SERPAPI_KEY", raising=False)

    result = search_events(MATCHING_EVENTS_PARAMS)

    assert len(result["events_results"]) == 10
    assert result["events_results"][0]["title"] == "More Than Networking: Austin Business Mastermind"


def test_events_raises_not_configured_error_for_any_other_search(monkeypatch):
    monkeypatch.delenv("SERPAPI_KEY", raising=False)

    with pytest.raises(SerpApiNotConfiguredError, match="SERPAPI_KEY"):
        search_events(OTHER_EVENTS_PARAMS)


def test_booking_link_returns_the_url_for_the_one_matching_token(monkeypatch):
    monkeypatch.delenv("SERPAPI_KEY", raising=False)

    result = get_flight_booking_link(MATCHING_BOOKING_LINK_PARAMS)

    assert result == {"url": "https://www.google.com/travel/clk/f", "post_data": None}


def test_booking_link_returns_none_values_for_any_other_token(monkeypatch):
    monkeypatch.delenv("SERPAPI_KEY", raising=False)

    result = get_flight_booking_link(OTHER_BOOKING_LINK_PARAMS)

    assert result == {"url": None, "post_data": None}


def test_booking_link_returns_the_url_for_the_matching_round_trip_token(monkeypatch):
    monkeypatch.delenv("SERPAPI_KEY", raising=False)

    result = get_flight_booking_link(MATCHING_ROUND_TRIP_BOOKING_LINK_PARAMS)

    assert result == {"url": "https://www.google.com/travel/clk/r", "post_data": None}


def test_booking_link_calls_serpapi_with_return_date_when_present(monkeypatch):
    monkeypatch.setenv("SERPAPI_KEY", "test-key")

    captured = {}

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {
                "booking_options": [
                    {"together": {"booking_request": {"url": "https://example.com/rt", "post_data": "u=abc"}}}
                ]
            }

    def fake_get(url, params=None, timeout=None):
        captured["params"] = params
        return FakeResponse()

    monkeypatch.setattr("app.search.adapters.serpapi.httpx.get", fake_get)

    get_flight_booking_link(MATCHING_ROUND_TRIP_BOOKING_LINK_PARAMS)

    assert captured["params"]["return_date"] == "2026-11-07"


def test_booking_link_calls_serpapi_with_booking_token_and_returns_cheapest_option(monkeypatch):
    monkeypatch.setenv("SERPAPI_KEY", "test-key")

    captured = {}

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {
                "booking_options": [
                    {
                        "together": {
                            "price": 214,
                            "booking_request": {"url": "https://example.com/cheapest", "post_data": "u=xyz"},
                        }
                    },
                    {"together": {"price": 249, "booking_request": {"url": "https://example.com/pricier"}}},
                ]
            }

    def fake_get(url, params=None, timeout=None):
        captured["params"] = params
        return FakeResponse()

    monkeypatch.setattr("app.search.adapters.serpapi.httpx.get", fake_get)

    result = get_flight_booking_link(MATCHING_BOOKING_LINK_PARAMS)

    assert captured["params"]["engine"] == "google_flights"
    assert captured["params"]["booking_token"] == _STUB_BOOKING_TOKEN
    assert captured["params"]["departure_id"] == "DAL"
    assert result == {"url": "https://example.com/cheapest", "post_data": "u=xyz"}


def test_booking_link_returns_none_values_when_serpapi_has_no_booking_options(monkeypatch):
    monkeypatch.setenv("SERPAPI_KEY", "test-key")

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"booking_options": []}

    monkeypatch.setattr("app.search.adapters.serpapi.httpx.get", lambda url, params=None, timeout=None: FakeResponse())

    result = get_flight_booking_link(MATCHING_BOOKING_LINK_PARAMS)

    assert result == {"url": None, "post_data": None}


def test_return_flights_returns_the_fixture_for_the_matching_departure_token(monkeypatch):
    monkeypatch.delenv("SERPAPI_KEY", raising=False)

    result = get_return_flights(MATCHING_RETURN_FLIGHTS_PARAMS)

    assert len(result["best_flights"]) == 1
    leg = result["best_flights"][0]["flights"][0]
    assert leg["departure_airport"]["id"] == "DEN"
    assert leg["arrival_airport"]["id"] == "DAL"


def test_return_flights_returns_same_shaped_empty_response_for_any_other_token(monkeypatch):
    monkeypatch.delenv("SERPAPI_KEY", raising=False)

    result = get_return_flights(OTHER_RETURN_FLIGHTS_PARAMS)

    assert result["best_flights"] == []
    assert result["search_parameters"]["departure_id"] == "DAL"
    assert result["search_parameters"]["arrival_id"] == "DEN"


def test_return_flights_calls_serpapi_with_departure_token_and_round_trip_type(monkeypatch):
    monkeypatch.setenv("SERPAPI_KEY", "test-key")

    captured = {}

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"best_flights": []}

    def fake_get(url, params=None, timeout=None):
        captured["params"] = params
        return FakeResponse()

    monkeypatch.setattr("app.search.adapters.serpapi.httpx.get", fake_get)

    get_return_flights(MATCHING_RETURN_FLIGHTS_PARAMS)

    assert captured["params"]["engine"] == "google_flights"
    assert captured["params"]["type"] == "1"
    assert captured["params"]["departure_id"] == "DAL"
    assert captured["params"]["arrival_id"] == "DEN"
    assert captured["params"]["departure_token"] == _STUB_RETURN_DEPARTURE_TOKEN
    assert captured["params"]["show_hidden"] == "true"


def test_hotel_booking_link_returns_the_url_and_address_for_the_one_matching_token(monkeypatch):
    monkeypatch.delenv("SERPAPI_KEY", raising=False)

    result = get_hotel_booking_link(MATCHING_HOTEL_BOOKING_LINK_PARAMS)

    assert result == {
        "url": "https://www.hilton.com/en/hotels/dpsbahi-hilton-bali-resort/?SEO_id=GMB-APAC-HI-DPSBAHI",
        "address": "Jl. Raya Nusa Dua Selatan, Benoa, Kec. Kuta Sel., Kabupaten Badung, Bali 80361, Indonesia",
    }


def test_hotel_booking_link_returns_none_values_for_any_other_token(monkeypatch):
    monkeypatch.delenv("SERPAPI_KEY", raising=False)

    result = get_hotel_booking_link(OTHER_HOTEL_BOOKING_LINK_PARAMS)

    assert result == {"url": None, "address": None}


def test_hotel_booking_link_calls_serpapi_with_property_token_and_returns_link_and_address(monkeypatch):
    monkeypatch.setenv("SERPAPI_KEY", "test-key")

    captured = {}

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"link": "https://example.com/hotel", "address": "123 Example St"}

    def fake_get(url, params=None, timeout=None):
        captured["params"] = params
        return FakeResponse()

    monkeypatch.setattr("app.search.adapters.serpapi.httpx.get", fake_get)

    result = get_hotel_booking_link(MATCHING_HOTEL_BOOKING_LINK_PARAMS)

    assert captured["params"]["engine"] == "google_hotels"
    assert captured["params"]["q"] == "Bali Resorts"
    assert captured["params"]["property_token"] == _STUB_HOTEL_PROPERTY_TOKEN
    assert captured["params"]["adults"] == "2"
    assert result == {"url": "https://example.com/hotel", "address": "123 Example St"}


def test_hotel_booking_link_returns_none_values_when_serpapi_has_no_link_or_address(monkeypatch):
    monkeypatch.setenv("SERPAPI_KEY", "test-key")

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {}

    monkeypatch.setattr("app.search.adapters.serpapi.httpx.get", lambda url, params=None, timeout=None: FakeResponse())

    result = get_hotel_booking_link(MATCHING_HOTEL_BOOKING_LINK_PARAMS)

    assert result == {"url": None, "address": None}


@pytest.mark.parametrize(
    "params, expected_q",
    [
        ({}, "Events"),
        ({"startDate": "2026-09-21", "endDate": "2026-10-10"}, "Events September 21 to October 10"),
        (
            {"eventName": "Music", "startDate": "2026-09-21", "endDate": "2026-09-26"},
            "Music Events September 21 to September 26",
        ),
        ({"startDate": "2026-09-21", "endDate": ""}, "Events September 21"),
        ({"startDate": "2026-09-21"}, "Events September 21"),
        ({"startDate": "2026-09-21", "endDate": "2026-09-21"}, "Events September 21"),
        ({"startDate": "2026-09-21", "endDate": "2026-09-01"}, "Events September 21"),
        ({"startDate": "", "endDate": "2026-10-10"}, "Events"),
    ],
)
def test_events_q_formats_dates_as_month_day_never_numeric(fake_serpapi, params, expected_q):
    search_events({"location": "Austin, Texas", **params})

    assert fake_serpapi["params"]["q"] == expected_q


def test_events_stub_matches_location_only_search(monkeypatch):
    monkeypatch.delenv("SERPAPI_KEY", raising=False)

    result = search_events({"location": "Austin, Texas", "eventName": "", "startDate": "", "endDate": ""})

    assert len(result["events_results"]) == 10


def test_events_uses_the_undeprecated_google_engine_and_strips_to_events_results_only(fake_serpapi):
    """engine=google_events is deprecated; adapter must use plain engine=google and
    discard everything but events_results (organic_results/related_questions/
    ai_overview/search_metadata are real fields on that response and must not leak)."""
    fake_serpapi["json"] = {
        "search_metadata": {"id": "abc123"},
        "search_parameters": {"engine": "google"},
        "organic_results": [{"title": "unrelated web page"}],
        "related_questions": [{"question": "unrelated"}],
        "ai_overview": {"text_blocks": []},
        "events_results": [{"title": "Networking Night"}],
    }

    result = search_events(MATCHING_EVENTS_PARAMS)

    assert fake_serpapi["params"]["engine"] == "google"
    assert fake_serpapi["params"]["q"] == "Networking Events October 1"
    assert fake_serpapi["params"]["location"] == "Austin, Texas, United States"
    assert result == {"events_results": [{"title": "Networking Night"}]}
