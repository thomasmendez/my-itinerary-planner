ONE_WAY_PAYLOAD = {
    "source": "search",
    "origin": "SFO",
    "destination": "JFK",
    "outbound_departs_at": "2026-06-22T08:00:00+00:00",
    "outbound_arrives_at": "2026-06-22T16:30:00+00:00",
    "airline": "United",
    "price": 412.50,
    "duration_minutes": 330,
    "stops": 0,
    "raw_payload": {"booking_token": "abc123"},
}

ROUND_TRIP_PAYLOAD = {
    **ONE_WAY_PAYLOAD,
    "return_departs_at": "2026-06-29T10:00:00+00:00",
    "return_arrives_at": "2026-06-29T18:00:00+00:00",
}


def _make_trip(client, name="Trip"):
    return client.post("/api/trips", json={"name": name}).json()["id"]


def _confirm_flight(client, trip_id, payload):
    saved = client.post(f"/api/trips/{trip_id}/flights", json=payload).json()
    client.patch(f"/api/trips/{trip_id}/flights/{saved['id']}", json={"status": "confirmed"})
    return saved


def test_saving_a_one_way_flight_creates_one_candidate_departure_entry(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/flights", json=ONE_WAY_PAYLOAD).json()

    entries = client.get(f"/api/trips/{trip_id}/calendar").json()
    assert len(entries) == 1
    entry = entries[0]
    assert entry["type"] == "flight_departure"
    assert entry["status"] == "candidate"
    assert entry["trip_id"] == trip_id
    assert entry["source_type"] == "saved_flight"
    assert entry["source_id"] == saved["id"]
    assert entry["starts_at"] == ONE_WAY_PAYLOAD["outbound_departs_at"]
    assert entry["ends_at"] == ONE_WAY_PAYLOAD["outbound_arrives_at"]


def test_saving_a_round_trip_flight_creates_candidate_departure_and_return_entries(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/flights", json=ROUND_TRIP_PAYLOAD).json()

    entries = client.get(f"/api/trips/{trip_id}/calendar").json()
    assert len(entries) == 2
    assert {e["type"] for e in entries} == {"flight_departure", "flight_return"}
    assert all(e["status"] == "candidate" for e in entries)
    assert all(e["source_type"] == "saved_flight" and e["source_id"] == saved["id"] for e in entries)

    departure = next(e for e in entries if e["type"] == "flight_departure")
    assert departure["starts_at"] == ROUND_TRIP_PAYLOAD["outbound_departs_at"]
    assert departure["ends_at"] == ROUND_TRIP_PAYLOAD["outbound_arrives_at"]

    return_leg = next(e for e in entries if e["type"] == "flight_return")
    assert return_leg["starts_at"] == ROUND_TRIP_PAYLOAD["return_departs_at"]
    assert return_leg["ends_at"] == ROUND_TRIP_PAYLOAD["return_arrives_at"]


def test_confirming_a_candidate_updates_its_entries_to_confirmed_without_duplicating(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/flights", json=ROUND_TRIP_PAYLOAD).json()
    before = {e["id"]: e for e in client.get(f"/api/trips/{trip_id}/calendar").json()}
    assert all(e["status"] == "candidate" for e in before.values())

    client.patch(f"/api/trips/{trip_id}/flights/{saved['id']}", json={"status": "confirmed"})

    after = client.get(f"/api/trips/{trip_id}/calendar").json()
    assert len(after) == len(before)  # same entries updated in place, not duplicated
    assert {e["id"] for e in after} == set(before.keys())
    assert all(e["status"] == "confirmed" for e in after)


def test_trip_calendar_is_scoped_to_its_trip(client):
    trip_a = _make_trip(client, "Trip A")
    trip_b = _make_trip(client, "Trip B")
    _confirm_flight(client, trip_a, ONE_WAY_PAYLOAD)

    assert client.get(f"/api/trips/{trip_b}/calendar").json() == []
    assert len(client.get(f"/api/trips/{trip_a}/calendar").json()) == 1


def test_get_trip_calendar_404_on_missing_trip(client):
    assert client.get("/api/trips/999999/calendar").status_code == 404


def test_aggregate_calendar_returns_entries_across_trips(client):
    trip_a = _make_trip(client, "Trip A")
    trip_b = _make_trip(client, "Trip B")
    _confirm_flight(client, trip_a, ONE_WAY_PAYLOAD)
    other_payload = {
        **ONE_WAY_PAYLOAD,
        "airline": "Delta",
        "outbound_departs_at": "2026-08-01T08:00:00+00:00",
        "outbound_arrives_at": "2026-08-01T16:00:00+00:00",
    }
    _confirm_flight(client, trip_b, other_payload)

    entries = client.get("/api/calendar").json()
    assert len(entries) == 2
    assert {e["trip_id"] for e in entries} == {trip_a, trip_b}


def test_aggregate_calendar_filters_by_date_range(client):
    trip_id = _make_trip(client)
    _confirm_flight(client, trip_id, ONE_WAY_PAYLOAD)  # 2026-06-22
    later_payload = {
        **ONE_WAY_PAYLOAD,
        "airline": "Delta",
        "outbound_departs_at": "2026-09-01T08:00:00+00:00",
        "outbound_arrives_at": "2026-09-01T16:00:00+00:00",
    }
    _confirm_flight(client, trip_id, later_payload)

    res = client.get("/api/calendar", params={"start": "2026-06-01", "end": "2026-06-30"})
    entries = res.json()
    assert len(entries) == 1
    assert entries[0]["starts_at"] == ONE_WAY_PAYLOAD["outbound_departs_at"]
