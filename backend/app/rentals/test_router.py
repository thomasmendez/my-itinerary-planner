RENTAL_PAYLOAD = {
    "source": "custom",
    "description": "Rented SUV from Enterprise",
    "pickup_location": "LAX Airport",
    "pickup_at": "2026-08-29T10:00:00+00:00",
    "dropoff_at": "2026-08-30T10:00:00+00:00",
    "price": 85.0,
    "raw_payload": {"source": "custom", "vehicle": "SUV"},
}


def _make_trip(client):
    return client.post("/api/trips", json={"name": "Bali Trip"}).json()["id"]


def test_save_rental_persists_as_candidate(client):
    trip_id = _make_trip(client)
    res = client.post(f"/api/trips/{trip_id}/rentals", json=RENTAL_PAYLOAD)
    assert res.status_code == 201
    body = res.json()
    assert body["status"] == "candidate"
    assert body["trip_id"] == trip_id
    assert body["source"] == "custom"
    assert body["raw_payload"] == {"source": "custom", "vehicle": "SUV"}
    assert body["overlap_warning"] is None

    listed = client.get(f"/api/trips/{trip_id}/rentals").json()
    assert len(listed) == 1
    assert listed[0]["id"] == body["id"]


def test_save_accepts_missing_price(client):
    # Custom rentals allow no price entirely, unlike hotels' price_per_night,
    # which is required.
    trip_id = _make_trip(client)
    payload = {k: v for k, v in RENTAL_PAYLOAD.items() if k != "price"}
    res = client.post(f"/api/trips/{trip_id}/rentals", json=payload)
    assert res.status_code == 201
    assert res.json()["price"] is None


def test_save_accepts_zero_price(client):
    trip_id = _make_trip(client)
    payload = {**RENTAL_PAYLOAD, "price": 0.0}
    res = client.post(f"/api/trips/{trip_id}/rentals", json=payload)
    assert res.status_code == 201
    assert res.json()["price"] == 0.0


def test_save_identical_rental_returns_409(client):
    trip_id = _make_trip(client)
    client.post(f"/api/trips/{trip_id}/rentals", json=RENTAL_PAYLOAD)
    res = client.post(f"/api/trips/{trip_id}/rentals", json=RENTAL_PAYLOAD)
    assert res.status_code == 409
    assert "already saved" in res.json()["detail"]


def test_save_duplicate_key_ignores_description_and_price(client):
    # Find_duplicate keys off (pickup_location, pickup_at, dropoff_at)
    # only - unlike hotels, description/price are not part of the duplicate check.
    trip_id = _make_trip(client)
    client.post(f"/api/trips/{trip_id}/rentals", json=RENTAL_PAYLOAD)
    second_payload = {**RENTAL_PAYLOAD, "description": "Borrowing Dad's car", "price": 0.0}
    res = client.post(f"/api/trips/{trip_id}/rentals", json=second_payload)
    assert res.status_code == 409


def test_patch_confirms_rental(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/rentals", json=RENTAL_PAYLOAD).json()

    res = client.patch(f"/api/trips/{trip_id}/rentals/{saved['id']}", json={"status": "confirmed"})
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "confirmed"
    assert body["overlap_warning"] is None


def test_patch_missing_rental_returns_404(client):
    trip_id = _make_trip(client)
    res = client.patch(f"/api/trips/{trip_id}/rentals/999999", json={"status": "confirmed"})
    assert res.status_code == 404


def test_patch_confirm_warns_on_overlapping_confirmed_rental(client):
    trip_id = _make_trip(client)
    first = client.post(f"/api/trips/{trip_id}/rentals", json=RENTAL_PAYLOAD).json()
    client.patch(f"/api/trips/{trip_id}/rentals/{first['id']}", json={"status": "confirmed"})

    second_payload = {
        **RENTAL_PAYLOAD,
        "description": "Backup rental from Hertz",
        "pickup_location": "Uluwatu Office",
        "pickup_at": "2026-08-29T14:00:00+00:00",
        "dropoff_at": "2026-08-30T14:00:00+00:00",
    }
    second = client.post(f"/api/trips/{trip_id}/rentals", json=second_payload).json()

    res = client.patch(f"/api/trips/{trip_id}/rentals/{second['id']}", json={"status": "confirmed"})
    assert res.status_code == 200
    body = res.json()
    # Overlap is a warning, not a block - both rentals end up confirmed.
    assert body["status"] == "confirmed"
    assert "overlapping" in body["overlap_warning"]
    assert str(first["id"]) in body["overlap_warning"]


def test_patch_confirm_does_not_warn_on_back_to_back_times(client):
    # find_overlap uses inclusive=False for rentals, same as hotels -
    # a dropoff instant equal to the next rental's pickup instant is a normal same-day
    # handoff (drop off car A at 10:00, pick up car B at 10:00), not a conflict. This is
    # unlike flights' inclusive=True, which is about a single traveler physically being on
    # two flights at once - that reasoning doesn't apply to a rental swap between two cars.
    trip_id = _make_trip(client)
    first = client.post(f"/api/trips/{trip_id}/rentals", json=RENTAL_PAYLOAD).json()
    client.patch(f"/api/trips/{trip_id}/rentals/{first['id']}", json={"status": "confirmed"})

    second_payload = {
        **RENTAL_PAYLOAD,
        "description": "Backup rental from Hertz",
        "pickup_location": "Uluwatu Office",
        "pickup_at": RENTAL_PAYLOAD["dropoff_at"],  # dropoff of first == pickup of second
        "dropoff_at": "2026-08-31T10:00:00+00:00",
    }
    second = client.post(f"/api/trips/{trip_id}/rentals", json=second_payload).json()

    res = client.patch(f"/api/trips/{trip_id}/rentals/{second['id']}", json={"status": "confirmed"})
    assert res.status_code == 200
    assert res.json()["overlap_warning"] is None


def test_delete_removes_saved_rental(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/rentals", json=RENTAL_PAYLOAD).json()

    res = client.delete(f"/api/trips/{trip_id}/rentals/{saved['id']}")
    assert res.status_code == 204
    assert client.get(f"/api/trips/{trip_id}/rentals").json() == []


def test_deleting_trip_cascades_to_saved_rentals(client):
    trip_id = _make_trip(client)
    client.post(f"/api/trips/{trip_id}/rentals", json=RENTAL_PAYLOAD)

    client.delete(f"/api/trips/{trip_id}")
    res = client.get(f"/api/trips/{trip_id}/rentals")
    assert res.status_code == 404


def test_operations_on_missing_trip_return_404(client):
    assert client.get("/api/trips/999999/rentals").status_code == 404
    assert client.post("/api/trips/999999/rentals", json=RENTAL_PAYLOAD).status_code == 404


def test_save_rejects_non_iso_pickup_at(client):
    trip_id = _make_trip(client)
    bad_payload = {**RENTAL_PAYLOAD, "pickup_at": "August 29 2026 10am"}
    res = client.post(f"/api/trips/{trip_id}/rentals", json=bad_payload)
    assert res.status_code == 422


def test_save_rejects_non_iso_dropoff_at(client):
    trip_id = _make_trip(client)
    bad_payload = {**RENTAL_PAYLOAD, "dropoff_at": "not-a-datetime"}
    res = client.post(f"/api/trips/{trip_id}/rentals", json=bad_payload)
    assert res.status_code == 422


def test_save_rejects_missing_pickup_location(client):
    # pickup_location is required - the user wants to always know where the
    # rental will be picked up.
    trip_id = _make_trip(client)
    payload = {k: v for k, v in RENTAL_PAYLOAD.items() if k != "pickup_location"}
    res = client.post(f"/api/trips/{trip_id}/rentals", json=payload)
    assert res.status_code == 422


def test_save_rejects_search_source(client):
    # source is schema-locked to Literal["custom"] - rentals have no search path.
    # "search" is rejected rather than silently accepted, in case this gets
    # revisited if a provider is found later.
    trip_id = _make_trip(client)
    bad_payload = {**RENTAL_PAYLOAD, "source": "search"}
    res = client.post(f"/api/trips/{trip_id}/rentals", json=bad_payload)
    assert res.status_code == 422


def test_saving_candidate_rental_creates_candidate_calendar_entry(client):
    # Regression: candidates must render on the calendar too, not just confirmed items
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/rentals", json=RENTAL_PAYLOAD).json()

    entries = client.get(f"/api/trips/{trip_id}/calendar").json()
    assert len(entries) == 1
    assert entries[0]["status"] == "candidate"
    assert entries[0]["type"] == "rental"
    assert entries[0]["source_type"] == "saved_rental"
    assert entries[0]["source_id"] == saved["id"]
    assert entries[0]["label"] == RENTAL_PAYLOAD["description"]
    assert entries[0]["starts_at"] == RENTAL_PAYLOAD["pickup_at"]
    assert entries[0]["ends_at"] == RENTAL_PAYLOAD["dropoff_at"]


def test_confirming_rental_updates_calendar_entry_in_place(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/rentals", json=RENTAL_PAYLOAD).json()

    client.patch(f"/api/trips/{trip_id}/rentals/{saved['id']}", json={"status": "confirmed"})

    entries = client.get(f"/api/trips/{trip_id}/calendar").json()
    assert len(entries) == 1
    assert entries[0]["status"] == "confirmed"


def test_deleting_confirmed_rental_removes_calendar_entries(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/rentals", json=RENTAL_PAYLOAD).json()
    client.patch(f"/api/trips/{trip_id}/rentals/{saved['id']}", json={"status": "confirmed"})
    assert len(client.get(f"/api/trips/{trip_id}/calendar").json()) == 1

    client.delete(f"/api/trips/{trip_id}/rentals/{saved['id']}")
    assert client.get(f"/api/trips/{trip_id}/calendar").json() == []


def test_deleting_candidate_rental_removes_its_calendar_entries(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/rentals", json=RENTAL_PAYLOAD).json()
    assert len(client.get(f"/api/trips/{trip_id}/calendar").json()) == 1

    res = client.delete(f"/api/trips/{trip_id}/rentals/{saved['id']}")
    assert res.status_code == 204
    assert client.get(f"/api/trips/{trip_id}/calendar").json() == []


def test_patch_edits_candidate_rental_and_resyncs_calendar_entry(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/rentals", json=RENTAL_PAYLOAD).json()

    res = client.patch(
        f"/api/trips/{trip_id}/rentals/{saved['id']}",
        json={"pickup_at": "2026-09-01T10:00:00+00:00", "dropoff_at": "2026-09-02T10:00:00+00:00", "price": 120.0},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["pickup_at"] == "2026-09-01T10:00:00+00:00"
    assert body["price"] == 120.0
    assert body["status"] == "candidate"

    entries = client.get(f"/api/trips/{trip_id}/calendar").json()
    assert len(entries) == 1
    assert entries[0]["starts_at"] == "2026-09-01T10:00:00+00:00"


def test_patch_edit_rejected_once_confirmed(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/rentals", json=RENTAL_PAYLOAD).json()
    client.patch(f"/api/trips/{trip_id}/rentals/{saved['id']}", json={"status": "confirmed"})

    res = client.patch(f"/api/trips/{trip_id}/rentals/{saved['id']}", json={"price": 1.0})
    assert res.status_code == 400


def test_deleting_trip_cascades_to_calendar_entries(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/rentals", json=RENTAL_PAYLOAD).json()
    client.patch(f"/api/trips/{trip_id}/rentals/{saved['id']}", json={"status": "confirmed"})

    client.delete(f"/api/trips/{trip_id}")

    entries = client.get("/api/calendar").json()
    assert all(e["trip_id"] != trip_id for e in entries)
