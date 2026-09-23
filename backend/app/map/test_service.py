from app.common.enums import ItemStatus, SourceType
from app.events.models import Event
from app.flights.models import SavedFlight
from app.hotels.models import SavedHotel
from app.map import service
from app.rentals.models import SavedRental
from app.trips.models import Trip

AUSTIN_COORDS = (30.2672, -97.7431)
DALLAS_COORDS = (32.7767, -96.7970)
# Real coordinates from the vendored IATA dataset (map/data/iata_airports.csv), not the
# geocoding-fixture coords above - flight airport codes resolve via that lookup, not a
# geocode call, so a test exercising it must check against the dataset's actual values.
AUS_AIRPORT_COORDS = (30.197535, -97.662015)
DFW_AIRPORT_COORDS = (32.896801, -97.038002)


def _fake_geocode_get(coords_by_query):
    """A fake for app.map.adapters.ors.httpx.get keyed by the `text` param, mirroring ORS's
    geocode/search GeoJSON response shape (coordinates as [lon, lat])."""

    def fake_get(url, params=None, timeout=None):
        class FakeResponse:
            def raise_for_status(self):
                pass

            def json(self):
                match = coords_by_query.get(params["text"])
                if match is None:
                    return {"features": []}
                lat, lon = match
                return {"features": [{"geometry": {"coordinates": [lon, lat]}}]}

        return FakeResponse()

    return fake_get


# --- geocode cache-through -------------------------------------------------


def test_geocode_returns_none_and_does_not_cache_when_unresolvable(db_session, monkeypatch):
    monkeypatch.setenv("ORS_API_KEY", "test-key")
    monkeypatch.setattr("app.map.adapters.ors.httpx.get", _fake_geocode_get({}))

    assert service.geocode(db_session, "nowhere in particular") is None
    assert service.get_cached_coords(db_session, "nowhere in particular") is None


def test_geocode_calls_ors_on_cache_miss_and_stores_the_result(db_session, monkeypatch):
    monkeypatch.setenv("ORS_API_KEY", "test-key")
    monkeypatch.setattr("app.map.adapters.ors.httpx.get", _fake_geocode_get({"Austin, Texas": AUSTIN_COORDS}))

    assert service.geocode(db_session, "Austin, Texas") == AUSTIN_COORDS
    assert service.get_cached_coords(db_session, "Austin, Texas") == AUSTIN_COORDS


def test_geocode_reuses_the_cache_instead_of_calling_ors_again(db_session, monkeypatch):
    monkeypatch.setenv("ORS_API_KEY", "test-key")
    calls = []

    def counting_get(url, params=None, timeout=None):
        calls.append(params["text"])
        return _fake_geocode_get({"Austin, Texas": AUSTIN_COORDS})(url, params, timeout)

    monkeypatch.setattr("app.map.adapters.ors.httpx.get", counting_get)

    service.geocode(db_session, "Austin, Texas")
    service.geocode(db_session, "Austin, Texas")

    assert calls == ["Austin, Texas"]


def test_geocode_cache_key_is_case_and_whitespace_insensitive(db_session, monkeypatch):
    monkeypatch.setenv("ORS_API_KEY", "test-key")
    calls = []

    def counting_get(url, params=None, timeout=None):
        calls.append(params["text"])
        return _fake_geocode_get({"Austin, Texas": AUSTIN_COORDS})(url, params, timeout)

    monkeypatch.setattr("app.map.adapters.ors.httpx.get", counting_get)

    service.geocode(db_session, "Austin, Texas")
    service.geocode(db_session, "  austin, texas  ")

    assert calls == ["Austin, Texas"]


# --- list_trip_points -------------------------------------------------------


def _make_trip(db_session) -> int:
    trip = Trip(name="Texas Trip")
    db_session.add(trip)
    db_session.commit()
    db_session.refresh(trip)
    return trip.id


def _forbid_geocode_call(monkeypatch, reason: str) -> None:
    """Fails the test if map/service.py ever calls out to ORS's geocode endpoint -
    used by tests asserting a point resolves without geocoding (IATA lookup) or must
    never be geocoded at all (no real location field to geocode)."""

    def unexpected_call(*args, **kwargs):
        raise AssertionError(reason)

    monkeypatch.setattr("app.map.adapters.ors.httpx.get", unexpected_call)


def test_flight_yields_a_departure_and_arrival_point_via_the_bundled_iata_lookup(db_session, monkeypatch):
    # AUS/DFW are real IATA codes in the vendored dataset (map/data/iata_airports.csv) -
    # this must resolve without ever calling ORS's geocode endpoint.
    _forbid_geocode_call(monkeypatch, "flight airport codes should resolve via the IATA lookup, not a geocode call")
    trip_id = _make_trip(db_session)
    flight = SavedFlight(
        trip_id=trip_id,
        status=ItemStatus.CANDIDATE,
        source="custom",
        origin="AUS",
        destination="DFW",
        outbound_departs_at="2026-10-01T08:00:00",
        outbound_arrives_at="2026-10-01T09:00:00",
        airline="Southwest",
        price=150.0,
        duration_minutes=60,
        stops=0,
        raw_payload={},
    )
    db_session.add(flight)
    db_session.commit()
    db_session.refresh(flight)

    points = service.list_trip_points(db_session, trip_id)

    assert len(points) == 2
    assert all(p.source_type == SourceType.SAVED_FLIGHT and p.source_id == flight.id for p in points)
    origin_point = next(p for p in points if p.location == "AUS")
    assert (origin_point.latitude, origin_point.longitude) == AUS_AIRPORT_COORDS
    destination_point = next(p for p in points if p.location == "DFW")
    assert (destination_point.latitude, destination_point.longitude) == DFW_AIRPORT_COORDS


def test_hotel_with_stored_coordinates_skips_geocoding(db_session, monkeypatch):
    calls = []
    monkeypatch.setattr(
        "app.map.adapters.ors.httpx.get",
        lambda url, params=None, timeout=None: calls.append(params["text"]),
    )
    trip_id = _make_trip(db_session)
    hotel = SavedHotel(
        trip_id=trip_id,
        status=ItemStatus.CONFIRMED,
        source="search",
        name="The Driskill",
        check_in_date="2026-10-01",
        check_out_date="2026-10-03",
        price_per_night=250.0,
        latitude=AUSTIN_COORDS[0],
        longitude=AUSTIN_COORDS[1],
        raw_payload={},
    )
    db_session.add(hotel)
    db_session.commit()
    db_session.refresh(hotel)

    points = service.list_trip_points(db_session, trip_id)

    assert len(points) == 1
    assert (points[0].latitude, points[0].longitude) == AUSTIN_COORDS
    assert points[0].status == ItemStatus.CONFIRMED
    assert calls == []


def test_hotel_without_an_address_is_never_geocoded_by_name(db_session, monkeypatch):
    # A custom hotel entry's name (e.g. "Friends House") is not a location - geocoding it
    # can match an unrelated real-world place sharing that name and plot a bogus marker.
    # Regression test: this used to fall back to `hotel.name` as the geocode query.
    _forbid_geocode_call(monkeypatch, "a hotel with no address should never be geocoded by its name")
    trip_id = _make_trip(db_session)
    hotel = SavedHotel(
        trip_id=trip_id,
        status=ItemStatus.CANDIDATE,
        source="custom",
        name="Friends House",
        address=None,
        check_in_date="2026-10-01",
        check_out_date="2026-10-03",
        price_per_night=100.0,
        raw_payload={},
    )
    db_session.add(hotel)
    db_session.commit()
    db_session.refresh(hotel)

    points = service.list_trip_points(db_session, trip_id)

    assert len(points) == 1
    assert points[0].location == ""
    assert points[0].latitude is None
    assert points[0].longitude is None


def test_hotel_without_stored_coordinates_geocodes_the_address(db_session, monkeypatch):
    monkeypatch.setenv("ORS_API_KEY", "test-key")
    monkeypatch.setattr(
        "app.map.adapters.ors.httpx.get",
        _fake_geocode_get({"123 Congress Ave, Austin, TX": AUSTIN_COORDS}),
    )
    trip_id = _make_trip(db_session)
    hotel = SavedHotel(
        trip_id=trip_id,
        status=ItemStatus.CANDIDATE,
        source="custom",
        name="Custom Lodging",
        address="123 Congress Ave, Austin, TX",
        check_in_date="2026-10-01",
        check_out_date="2026-10-03",
        price_per_night=100.0,
        raw_payload={},
    )
    db_session.add(hotel)
    db_session.commit()
    db_session.refresh(hotel)

    points = service.list_trip_points(db_session, trip_id)

    assert (points[0].latitude, points[0].longitude) == AUSTIN_COORDS


def test_rental_geocodes_pickup_location(db_session, monkeypatch):
    monkeypatch.setenv("ORS_API_KEY", "test-key")
    monkeypatch.setattr("app.map.adapters.ors.httpx.get", _fake_geocode_get({"AUS Airport": AUSTIN_COORDS}))
    trip_id = _make_trip(db_session)
    rental = SavedRental(
        trip_id=trip_id,
        status=ItemStatus.CANDIDATE,
        source="custom",
        description="Rented SUV",
        pickup_location="AUS Airport",
        pickup_at="2026-10-01T10:00:00",
        dropoff_at="2026-10-03T10:00:00",
        raw_payload={},
    )
    db_session.add(rental)
    db_session.commit()
    db_session.refresh(rental)

    points = service.list_trip_points(db_session, trip_id)

    assert len(points) == 1
    assert points[0].source_type == SourceType.SAVED_RENTAL
    assert (points[0].latitude, points[0].longitude) == AUSTIN_COORDS


def test_event_geocodes_location(db_session, monkeypatch):
    monkeypatch.setenv("ORS_API_KEY", "test-key")
    monkeypatch.setattr("app.map.adapters.ors.httpx.get", _fake_geocode_get({"Zilker Park": AUSTIN_COORDS}))
    trip_id = _make_trip(db_session)
    event = Event(
        trip_id=trip_id,
        status=ItemStatus.CONFIRMED,
        source="custom",
        name="Picnic",
        location="Zilker Park",
        starts_at="2026-10-02T12:00:00",
        raw_payload={},
    )
    db_session.add(event)
    db_session.commit()
    db_session.refresh(event)

    points = service.list_trip_points(db_session, trip_id)

    assert len(points) == 1
    assert points[0].source_type == SourceType.EVENT
    assert (points[0].latitude, points[0].longitude) == AUSTIN_COORDS


def test_event_without_a_location_is_listed_with_null_coordinates_and_never_geocoded(db_session, monkeypatch):
    _forbid_geocode_call(monkeypatch, "an event with no location should never be geocoded")
    trip_id = _make_trip(db_session)
    event = Event(
        trip_id=trip_id,
        status=ItemStatus.CONFIRMED,
        source="search",
        name="Mystery Event",
        location=None,
        starts_at="2026-10-02T12:00:00",
        raw_payload={},
    )
    db_session.add(event)
    db_session.commit()
    db_session.refresh(event)

    points = service.list_trip_points(db_session, trip_id)

    assert len(points) == 1
    assert points[0].source_type == SourceType.EVENT
    assert points[0].location == ""
    assert points[0].latitude is None
    assert points[0].longitude is None


def test_rental_without_a_pickup_location_is_listed_with_null_coordinates_and_never_geocoded(db_session, monkeypatch):
    _forbid_geocode_call(monkeypatch, "a rental with no pickup location should never be geocoded")
    trip_id = _make_trip(db_session)
    rental = SavedRental(
        trip_id=trip_id,
        status=ItemStatus.CANDIDATE,
        source="custom",
        description="Rented SUV",
        pickup_location="",
        pickup_at="2026-10-01T10:00:00",
        dropoff_at="2026-10-03T10:00:00",
        raw_payload={},
    )
    db_session.add(rental)
    db_session.commit()
    db_session.refresh(rental)

    points = service.list_trip_points(db_session, trip_id)

    assert len(points) == 1
    assert points[0].latitude is None
    assert points[0].longitude is None


def test_flight_with_blank_airport_codes_is_listed_with_null_coordinates_and_never_geocoded(db_session, monkeypatch):
    _forbid_geocode_call(monkeypatch, "a flight with no airport code should never be geocoded")
    trip_id = _make_trip(db_session)
    flight = SavedFlight(
        trip_id=trip_id,
        status=ItemStatus.CANDIDATE,
        source="custom",
        origin="",
        destination="",
        outbound_departs_at="2026-10-01T08:00:00",
        outbound_arrives_at="2026-10-01T09:00:00",
        airline="Southwest",
        price=150.0,
        duration_minutes=60,
        stops=0,
        raw_payload={},
    )
    db_session.add(flight)
    db_session.commit()
    db_session.refresh(flight)

    points = service.list_trip_points(db_session, trip_id)

    assert len(points) == 2
    assert all(p.latitude is None and p.longitude is None for p in points)


def test_unresolvable_location_yields_a_point_with_null_coordinates(db_session, monkeypatch):
    monkeypatch.setenv("ORS_API_KEY", "test-key")
    monkeypatch.setattr("app.map.adapters.ors.httpx.get", _fake_geocode_get({}))
    trip_id = _make_trip(db_session)
    rental = SavedRental(
        trip_id=trip_id,
        status=ItemStatus.CANDIDATE,
        source="custom",
        description="Rented SUV",
        pickup_location="somewhere unresolvable",
        pickup_at="2026-10-01T10:00:00",
        dropoff_at="2026-10-03T10:00:00",
        raw_payload={},
    )
    db_session.add(rental)
    db_session.commit()
    db_session.refresh(rental)

    points = service.list_trip_points(db_session, trip_id)

    assert len(points) == 1
    assert points[0].latitude is None
    assert points[0].longitude is None
