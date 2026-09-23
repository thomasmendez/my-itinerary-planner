def test_create_trip_persists_all_fields_and_stamps_timestamps(client):
    payload = {
        "name": "Paris 2026",
        "destinations": ["CDG"],
        "start_date": "2026-06-22",
        "end_date": "2026-06-29",
        "travelers": ["Thomas", "Jordan"],
    }
    res = client.post("/api/trips", json=payload)
    assert res.status_code == 201
    body = res.json()
    assert body["name"] == "Paris 2026"
    assert body["destinations"] == ["CDG"]
    assert body["travelers"] == ["Thomas", "Jordan"]
    assert body["created_at"] and body["updated_at"]

    fetched = client.get(f"/api/trips/{body['id']}")
    assert fetched.status_code == 200
    assert fetched.json() == body


def test_patch_updates_only_the_given_fields(client):
    created = client.post(
        "/api/trips", json={"name": "Rome", "destinations": ["FCO"], "travelers": []}
    ).json()

    patched = client.patch(f"/api/trips/{created['id']}", json={"end_date": "2026-09-10"})
    assert patched.status_code == 200
    body = patched.json()
    assert body["name"] == "Rome"
    assert body["destinations"] == ["FCO"]
    assert body["end_date"] == "2026-09-10"
    assert body["start_date"] is None


def test_delete_removes_the_trip(client):
    created = client.post("/api/trips", json={"name": "Temp"}).json()

    deleted = client.delete(f"/api/trips/{created['id']}")
    assert deleted.status_code == 204

    missing = client.get(f"/api/trips/{created['id']}")
    assert missing.status_code == 404


def test_get_missing_trip_returns_404(client):
    res = client.get("/api/trips/999999")
    assert res.status_code == 404


def test_create_rejects_non_iso_dates(client):
    res = client.post(
        "/api/trips",
        json={"name": "Bad Dates", "start_date": "July 28 2026", "end_date": "2026-08-02"},
    )
    assert res.status_code == 422


def test_patch_rejects_non_iso_date(client):
    created = client.post("/api/trips", json={"name": "Rome"}).json()

    res = client.patch(f"/api/trips/{created['id']}", json={"end_date": "09/10/2026"})
    assert res.status_code == 422


def test_list_trips_only_returns_trips_created_in_this_test(client):
    """Guards fixture isolation itself: would fail if db_session leaked state across tests."""
    assert client.get("/api/trips").json() == []

    client.post("/api/trips", json={"name": "Solo Trip"})

    body = client.get("/api/trips").json()
    assert len(body) == 1
    assert body[0]["name"] == "Solo Trip"
