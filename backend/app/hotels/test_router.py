HOTEL_PAYLOAD = {
    "source": "search",
    "name": "The Pandawa Hills Cenangan",
    "address": "Jl. Pandawa, Bali, Indonesia",
    "check_in_date": "2026-08-29",
    "check_out_date": "2026-08-30",
    "price_per_night": 145.0,
    "rating": 4.5,
    "distance_km": 2.1,
    "latitude": -8.8305,
    "longitude": 115.1625,
    "raw_payload": {"property_token": "abc123"},
}


def _make_trip(client):
    return client.post("/api/trips", json={"name": "Bali Trip"}).json()["id"]


def test_save_hotel_persists_as_candidate(client):
    trip_id = _make_trip(client)
    res = client.post(f"/api/trips/{trip_id}/hotels", json=HOTEL_PAYLOAD)
    assert res.status_code == 201
    body = res.json()
    assert body["status"] == "candidate"
    assert body["trip_id"] == trip_id
    assert body["raw_payload"] == {"property_token": "abc123"}
    assert body["latitude"] == -8.8305
    assert body["longitude"] == 115.1625
    assert body["overlap_warning"] is None

    listed = client.get(f"/api/trips/{trip_id}/hotels").json()
    assert len(listed) == 1
    assert listed[0]["id"] == body["id"]


def test_save_identical_hotel_returns_409(client):
    trip_id = _make_trip(client)
    client.post(f"/api/trips/{trip_id}/hotels", json=HOTEL_PAYLOAD)
    res = client.post(f"/api/trips/{trip_id}/hotels", json=HOTEL_PAYLOAD)
    assert res.status_code == 409
    assert "already saved" in res.json()["detail"]


def test_patch_confirms_hotel(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/hotels", json=HOTEL_PAYLOAD).json()

    res = client.patch(f"/api/trips/{trip_id}/hotels/{saved['id']}", json={"status": "confirmed"})
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "confirmed"
    assert body["overlap_warning"] is None


def test_patch_confirm_warns_on_overlapping_confirmed_hotel(client):
    trip_id = _make_trip(client)
    first = client.post(f"/api/trips/{trip_id}/hotels", json=HOTEL_PAYLOAD).json()
    client.patch(f"/api/trips/{trip_id}/hotels/{first['id']}", json={"status": "confirmed"})

    second_payload = {**HOTEL_PAYLOAD, "name": "Uluwatu Cliff Villas", "price_per_night": 200.0}
    second = client.post(f"/api/trips/{trip_id}/hotels", json=second_payload).json()

    res = client.patch(f"/api/trips/{trip_id}/hotels/{second['id']}", json={"status": "confirmed"})
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "confirmed"
    assert "overlapping dates" in body["overlap_warning"]
    assert str(first["id"]) in body["overlap_warning"]


def test_patch_confirm_does_not_warn_on_back_to_back_dates(client):
    # Check-out day of the first hotel == check-in day of the second — adjacent
    # stays, not an overlap.
    trip_id = _make_trip(client)
    first = client.post(f"/api/trips/{trip_id}/hotels", json=HOTEL_PAYLOAD).json()
    client.patch(f"/api/trips/{trip_id}/hotels/{first['id']}", json={"status": "confirmed"})

    second_payload = {
        **HOTEL_PAYLOAD,
        "name": "Uluwatu Cliff Villas",
        "check_in_date": "2026-08-30",
        "check_out_date": "2026-09-01",
    }
    second = client.post(f"/api/trips/{trip_id}/hotels", json=second_payload).json()

    res = client.patch(f"/api/trips/{trip_id}/hotels/{second['id']}", json={"status": "confirmed"})
    assert res.status_code == 200
    assert res.json()["overlap_warning"] is None


def test_delete_removes_saved_hotel(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/hotels", json=HOTEL_PAYLOAD).json()

    res = client.delete(f"/api/trips/{trip_id}/hotels/{saved['id']}")
    assert res.status_code == 204
    assert client.get(f"/api/trips/{trip_id}/hotels").json() == []


def test_deleting_trip_cascades_to_saved_hotels(client):
    trip_id = _make_trip(client)
    client.post(f"/api/trips/{trip_id}/hotels", json=HOTEL_PAYLOAD)

    client.delete(f"/api/trips/{trip_id}")
    res = client.get(f"/api/trips/{trip_id}/hotels")
    assert res.status_code == 404


def test_save_rejects_non_iso_check_in_date(client):
    trip_id = _make_trip(client)
    bad_payload = {**HOTEL_PAYLOAD, "check_in_date": "August 29 2026"}
    res = client.post(f"/api/trips/{trip_id}/hotels", json=bad_payload)
    assert res.status_code == 422


def test_save_rejects_non_iso_check_out_date(client):
    trip_id = _make_trip(client)
    bad_payload = {**HOTEL_PAYLOAD, "check_out_date": "not-a-date"}
    res = client.post(f"/api/trips/{trip_id}/hotels", json=bad_payload)
    assert res.status_code == 422


def test_save_accepts_null_rating_and_distance(client):
    trip_id = _make_trip(client)
    payload = {**HOTEL_PAYLOAD, "rating": None, "distance_km": None}
    res = client.post(f"/api/trips/{trip_id}/hotels", json=payload)
    assert res.status_code == 201
    body = res.json()
    assert body["rating"] is None
    assert body["distance_km"] is None


def test_save_accepts_missing_gps_coordinates(client):
    # Custom lodging has no gps_coordinates to stamp - only search results do.
    trip_id = _make_trip(client)
    payload = {k: v for k, v in HOTEL_PAYLOAD.items() if k not in ("latitude", "longitude")}
    res = client.post(f"/api/trips/{trip_id}/hotels", json=payload)
    assert res.status_code == 201
    body = res.json()
    assert body["latitude"] is None
    assert body["longitude"] is None


def test_save_accepts_missing_address(client):
    # Address isn't known until a follow-up property-details call resolves it.
    trip_id = _make_trip(client)
    payload = {k: v for k, v in HOTEL_PAYLOAD.items() if k != "address"}
    res = client.post(f"/api/trips/{trip_id}/hotels", json=payload)
    assert res.status_code == 201
    assert res.json()["address"] is None


def test_save_accepts_custom_lodging_payload(client):
    # Source 'custom', address falls back to '' (not null) when no location was entered, and
    # rating/distance/lat/long are all null since custom lodging has none of those.
    trip_id = _make_trip(client)
    payload = {
        "source": "custom",
        "name": "Staying at Mom's house",
        "address": "",
        "check_in_date": "2026-08-29",
        "check_out_date": "2026-08-30",
        "price_per_night": 0.0,
        "rating": None,
        "distance_km": None,
        "latitude": None,
        "longitude": None,
        "raw_payload": {"source": "custom", "booking_token": "custom-1"},
    }
    res = client.post(f"/api/trips/{trip_id}/hotels", json=payload)
    assert res.status_code == 201
    body = res.json()
    assert body["source"] == "custom"
    assert body["address"] == ""
    assert body["rating"] is None
    assert body["distance_km"] is None
    assert body["latitude"] is None
    assert body["longitude"] is None


def test_operations_on_missing_trip_return_404(client):
    assert client.get("/api/trips/999999/hotels").status_code == 404
    assert client.post("/api/trips/999999/hotels", json=HOTEL_PAYLOAD).status_code == 404


def test_patch_missing_hotel_returns_404(client):
    trip_id = _make_trip(client)
    res = client.patch(f"/api/trips/{trip_id}/hotels/999999", json={"status": "confirmed"})
    assert res.status_code == 404


def test_deleting_confirmed_hotel_removes_calendar_entries(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/hotels", json=HOTEL_PAYLOAD).json()
    client.patch(f"/api/trips/{trip_id}/hotels/{saved['id']}", json={"status": "confirmed"})
    assert len(client.get(f"/api/trips/{trip_id}/calendar").json()) == 1

    client.delete(f"/api/trips/{trip_id}/hotels/{saved['id']}")
    assert client.get(f"/api/trips/{trip_id}/calendar").json() == []


def test_deleting_candidate_hotel_removes_its_calendar_entries(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/hotels", json=HOTEL_PAYLOAD).json()
    assert len(client.get(f"/api/trips/{trip_id}/calendar").json()) == 1

    res = client.delete(f"/api/trips/{trip_id}/hotels/{saved['id']}")
    assert res.status_code == 204
    assert client.get(f"/api/trips/{trip_id}/calendar").json() == []


def test_saving_candidate_hotel_creates_candidate_calendar_entry(client):
    # Regression: candidates must render on the calendar too, not just confirmed items
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/hotels", json=HOTEL_PAYLOAD).json()

    entries = client.get(f"/api/trips/{trip_id}/calendar").json()
    assert len(entries) == 1
    assert entries[0]["status"] == "candidate"
    assert entries[0]["type"] == "hotel"
    assert entries[0]["source_type"] == "saved_hotel"
    assert entries[0]["source_id"] == saved["id"]
    assert entries[0]["starts_at"] == HOTEL_PAYLOAD["check_in_date"]
    assert entries[0]["ends_at"] == HOTEL_PAYLOAD["check_out_date"]


def test_confirming_hotel_updates_calendar_entry_in_place(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/hotels", json=HOTEL_PAYLOAD).json()

    client.patch(f"/api/trips/{trip_id}/hotels/{saved['id']}", json={"status": "confirmed"})

    entries = client.get(f"/api/trips/{trip_id}/calendar").json()
    assert len(entries) == 1
    assert entries[0]["status"] == "confirmed"


def test_patch_edits_candidate_custom_hotel_and_resyncs_calendar_entry(client):
    trip_id = _make_trip(client)
    custom_payload = {**HOTEL_PAYLOAD, "source": "custom"}
    saved = client.post(f"/api/trips/{trip_id}/hotels", json=custom_payload).json()

    res = client.patch(
        f"/api/trips/{trip_id}/hotels/{saved['id']}",
        json={"name": "Updated Stay", "check_in_date": "2026-09-01", "check_out_date": "2026-09-03"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["name"] == "Updated Stay"
    assert body["check_in_date"] == "2026-09-01"
    assert body["status"] == "candidate"

    entries = client.get(f"/api/trips/{trip_id}/calendar").json()
    assert len(entries) == 1
    assert entries[0]["starts_at"] == "2026-09-01"


def test_patch_edit_rejected_once_confirmed(client):
    trip_id = _make_trip(client)
    custom_payload = {**HOTEL_PAYLOAD, "source": "custom"}
    saved = client.post(f"/api/trips/{trip_id}/hotels", json=custom_payload).json()
    client.patch(f"/api/trips/{trip_id}/hotels/{saved['id']}", json={"status": "confirmed"})

    res = client.patch(f"/api/trips/{trip_id}/hotels/{saved['id']}", json={"name": "Nope"})
    assert res.status_code == 400


def test_deleting_trip_cascades_to_calendar_entries(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/hotels", json=HOTEL_PAYLOAD).json()
    client.patch(f"/api/trips/{trip_id}/hotels/{saved['id']}", json={"status": "confirmed"})

    client.delete(f"/api/trips/{trip_id}")

    entries = client.get("/api/calendar").json()
    assert all(e["trip_id"] != trip_id for e in entries)
