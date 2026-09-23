FLIGHT_PAYLOAD = {
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


def _make_trip(client):
    return client.post("/api/trips", json={"name": "NYC Trip"}).json()["id"]


def test_save_flight_persists_as_candidate(client):
    trip_id = _make_trip(client)
    res = client.post(f"/api/trips/{trip_id}/flights", json=FLIGHT_PAYLOAD)
    assert res.status_code == 201
    body = res.json()
    assert body["status"] == "candidate"
    assert body["trip_id"] == trip_id
    assert body["raw_payload"] == {"booking_token": "abc123"}
    assert body["overlap_warning"] is None

    listed = client.get(f"/api/trips/{trip_id}/flights").json()
    assert len(listed) == 1
    assert listed[0]["id"] == body["id"]


def test_save_identical_flight_returns_409(client):
    trip_id = _make_trip(client)
    client.post(f"/api/trips/{trip_id}/flights", json=FLIGHT_PAYLOAD)
    res = client.post(f"/api/trips/{trip_id}/flights", json=FLIGHT_PAYLOAD)
    assert res.status_code == 409
    assert "already saved" in res.json()["detail"]


def test_patch_confirms_flight(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/flights", json=FLIGHT_PAYLOAD).json()

    res = client.patch(f"/api/trips/{trip_id}/flights/{saved['id']}", json={"status": "confirmed"})
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "confirmed"
    assert body["overlap_warning"] is None


def test_patch_confirm_warns_on_overlapping_confirmed_flight(client):
    trip_id = _make_trip(client)
    first = client.post(f"/api/trips/{trip_id}/flights", json=FLIGHT_PAYLOAD).json()
    client.patch(f"/api/trips/{trip_id}/flights/{first['id']}", json={"status": "confirmed"})

    second_payload = {**FLIGHT_PAYLOAD, "airline": "Delta", "price": 500}
    second = client.post(f"/api/trips/{trip_id}/flights", json=second_payload).json()

    res = client.patch(f"/api/trips/{trip_id}/flights/{second['id']}", json={"status": "confirmed"})
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "confirmed"
    assert "overlapping dates" in body["overlap_warning"]
    assert str(first["id"]) in body["overlap_warning"]


def test_delete_removes_saved_flight(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/flights", json=FLIGHT_PAYLOAD).json()

    res = client.delete(f"/api/trips/{trip_id}/flights/{saved['id']}")
    assert res.status_code == 204
    assert client.get(f"/api/trips/{trip_id}/flights").json() == []


def test_deleting_trip_cascades_to_saved_flights(client):
    trip_id = _make_trip(client)
    client.post(f"/api/trips/{trip_id}/flights", json=FLIGHT_PAYLOAD)

    client.delete(f"/api/trips/{trip_id}")
    res = client.get(f"/api/trips/{trip_id}/flights")
    assert res.status_code == 404


def test_save_rejects_non_iso_departs_at(client):
    trip_id = _make_trip(client)
    bad_payload = {**FLIGHT_PAYLOAD, "outbound_departs_at": "June 22 2026 8:00am"}
    res = client.post(f"/api/trips/{trip_id}/flights", json=bad_payload)
    assert res.status_code == 422


def test_save_rejects_return_departs_without_return_arrives(client):
    trip_id = _make_trip(client)
    bad_payload = {**FLIGHT_PAYLOAD, "return_departs_at": "2026-06-29T10:00:00+00:00"}
    res = client.post(f"/api/trips/{trip_id}/flights", json=bad_payload)
    assert res.status_code == 422


def test_save_accepts_airport_local_time_with_no_utc_offset(client):
    # Search providers return naive local departure/arrival airport time (no
    # offset) - saved_flights timestamps must accept that as-is, not just UTC.
    trip_id = _make_trip(client)
    local_payload = {**FLIGHT_PAYLOAD, "outbound_departs_at": "2026-06-22 08:00"}
    res = client.post(f"/api/trips/{trip_id}/flights", json=local_payload)
    assert res.status_code == 201


def test_save_rejects_non_iso_departs_at_no_colon(client):
    trip_id = _make_trip(client)
    bad_payload = {**FLIGHT_PAYLOAD, "outbound_departs_at": "June 22 2026 8am"}
    res = client.post(f"/api/trips/{trip_id}/flights", json=bad_payload)
    assert res.status_code == 422


def test_save_rejects_non_iso_return_arrives_at(client):
    trip_id = _make_trip(client)
    bad_payload = {
        **FLIGHT_PAYLOAD,
        "return_departs_at": "2026-06-29T08:00:00+00:00",
        "return_arrives_at": "June 29 2026 4:00pm",
    }
    res = client.post(f"/api/trips/{trip_id}/flights", json=bad_payload)
    assert res.status_code == 422


def test_operations_on_missing_trip_return_404(client):
    assert client.get("/api/trips/999999/flights").status_code == 404
    assert client.post("/api/trips/999999/flights", json=FLIGHT_PAYLOAD).status_code == 404


def test_patch_missing_flight_returns_404(client):
    trip_id = _make_trip(client)
    res = client.patch(f"/api/trips/{trip_id}/flights/999999", json={"status": "confirmed"})
    assert res.status_code == 404


def test_deleting_confirmed_flight_removes_calendar_entries(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/flights", json=FLIGHT_PAYLOAD).json()
    client.patch(f"/api/trips/{trip_id}/flights/{saved['id']}", json={"status": "confirmed"})
    assert len(client.get(f"/api/trips/{trip_id}/calendar").json()) == 1

    client.delete(f"/api/trips/{trip_id}/flights/{saved['id']}")
    assert client.get(f"/api/trips/{trip_id}/calendar").json() == []


def test_deleting_candidate_flight_removes_its_calendar_entries(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/flights", json=FLIGHT_PAYLOAD).json()
    assert len(client.get(f"/api/trips/{trip_id}/calendar").json()) == 1

    res = client.delete(f"/api/trips/{trip_id}/flights/{saved['id']}")
    assert res.status_code == 204
    assert client.get(f"/api/trips/{trip_id}/calendar").json() == []


def test_patch_edits_candidate_custom_flight_and_resyncs_calendar_entry(client):
    trip_id = _make_trip(client)
    custom_payload = {
        **FLIGHT_PAYLOAD,
        "source": "custom",
        "airline": "Self-drive",
        "outbound_departs_at": "2026-06-22T08:00:00+00:00",
        "outbound_arrives_at": "2026-06-22T08:00:00+00:00",
    }
    saved = client.post(f"/api/trips/{trip_id}/flights", json=custom_payload).json()

    res = client.patch(
        f"/api/trips/{trip_id}/flights/{saved['id']}",
        json={
            "origin": "LAX",
            "destination": "SAN",
            "outbound_departs_at": "2026-07-01T09:00:00+00:00",
            "outbound_arrives_at": "2026-07-01T09:00:00+00:00",
            "price": 99.0,
            "raw_payload": {"booking_token": "abc123", "notes": "updated"},
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["origin"] == "LAX"
    assert body["destination"] == "SAN"
    assert body["price"] == 99.0
    assert body["status"] == "candidate"
    assert body["raw_payload"] == {"booking_token": "abc123", "notes": "updated"}

    entries = client.get(f"/api/trips/{trip_id}/calendar").json()
    assert len(entries) == 1
    assert entries[0]["starts_at"] == "2026-07-01T09:00:00+00:00"


def test_patch_edit_rejected_for_search_sourced_flight(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/flights", json=FLIGHT_PAYLOAD).json()

    res = client.patch(f"/api/trips/{trip_id}/flights/{saved['id']}", json={"origin": "LAX"})
    assert res.status_code == 400


def test_patch_edit_rejected_once_confirmed(client):
    trip_id = _make_trip(client)
    custom_payload = {**FLIGHT_PAYLOAD, "source": "custom"}
    saved = client.post(f"/api/trips/{trip_id}/flights", json=custom_payload).json()
    client.patch(f"/api/trips/{trip_id}/flights/{saved['id']}", json={"status": "confirmed"})

    res = client.patch(f"/api/trips/{trip_id}/flights/{saved['id']}", json={"origin": "LAX"})
    assert res.status_code == 400


def test_deleting_trip_cascades_to_calendar_entries(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/flights", json=FLIGHT_PAYLOAD).json()
    client.patch(f"/api/trips/{trip_id}/flights/{saved['id']}", json={"status": "confirmed"})

    client.delete(f"/api/trips/{trip_id}")

    entries = client.get("/api/calendar").json()
    assert all(e["trip_id"] != trip_id for e in entries)
