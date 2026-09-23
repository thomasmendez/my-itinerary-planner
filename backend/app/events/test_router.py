EVENT_PAYLOAD = {
    "source": "search",
    "name": "More Than Networking: Austin Business Mastermind",
    "location": "Mama Betty's Tex-Mex - Burnet Rd, Austin, TX",
    "starts_at": "2026-10-01T15:00:00",
    "ends_at": None,
    "price": None,
    "raw_payload": {"thumbnail": "https://serpapi.com/searches/abc/images/def.jpeg"},
}

# A second, spanned event - used for the overlap tests below (find_overlap needs a
# real [start, end] window on at least one side; EVENT_PAYLOAD above is a point event).
EVENT_PAYLOAD_WITH_SPAN = {
    "source": "search",
    "name": "Venture PFest 2026: Ideas to Impact + Pitch Competition",
    "location": "Courtyard by Marriott Austin Pflugerville, Pflugerville, TX",
    "starts_at": "2026-10-01T09:00:00",
    "ends_at": "2026-10-01T17:00:00",
    "price": None,
    "raw_payload": {"thumbnail": "https://serpapi.com/searches/abc/images/ghi.jpeg"},
}


def _make_trip(client):
    return client.post("/api/trips", json={"name": "Austin Trip"}).json()["id"]


def test_save_event_persists_as_candidate(client):
    trip_id = _make_trip(client)
    res = client.post(f"/api/trips/{trip_id}/events", json=EVENT_PAYLOAD)
    assert res.status_code == 201
    body = res.json()
    assert body["status"] == "candidate"
    assert body["trip_id"] == trip_id
    assert body["ends_at"] is None
    assert body["price"] is None
    assert body["raw_payload"] == EVENT_PAYLOAD["raw_payload"]
    assert body["overlap_warning"] is None

    listed = client.get(f"/api/trips/{trip_id}/events").json()
    assert len(listed) == 1
    assert listed[0]["id"] == body["id"]


def test_save_identical_event_returns_409(client):
    trip_id = _make_trip(client)
    client.post(f"/api/trips/{trip_id}/events", json=EVENT_PAYLOAD)
    res = client.post(f"/api/trips/{trip_id}/events", json=EVENT_PAYLOAD)
    assert res.status_code == 409
    assert "already saved" in res.json()["detail"]
    assert len(client.get(f"/api/trips/{trip_id}/events").json()) == 1


def test_save_same_event_at_a_different_time_does_not_conflict(client):
    # Same name/location, different starts_at - e.g. the user is comparing two
    # showtimes of the same event. Not a duplicate.
    trip_id = _make_trip(client)
    client.post(f"/api/trips/{trip_id}/events", json=EVENT_PAYLOAD)
    other_time = {**EVENT_PAYLOAD, "starts_at": "2026-10-02T15:00:00"}
    res = client.post(f"/api/trips/{trip_id}/events", json=other_time)
    assert res.status_code == 201
    assert len(client.get(f"/api/trips/{trip_id}/events").json()) == 2


def test_patch_confirms_event(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/events", json=EVENT_PAYLOAD).json()

    res = client.patch(f"/api/trips/{trip_id}/events/{saved['id']}", json={"status": "confirmed"})
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "confirmed"
    assert body["overlap_warning"] is None


def test_patch_confirm_warns_on_overlapping_confirmed_event(client):
    trip_id = _make_trip(client)
    first = client.post(f"/api/trips/{trip_id}/events", json=EVENT_PAYLOAD_WITH_SPAN).json()
    client.patch(f"/api/trips/{trip_id}/events/{first['id']}", json={"status": "confirmed"})

    # A point event (null ends_at) whose instant falls inside the first event's span.
    second = client.post(f"/api/trips/{trip_id}/events", json=EVENT_PAYLOAD).json()

    res = client.patch(f"/api/trips/{trip_id}/events/{second['id']}", json={"status": "confirmed"})
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "confirmed"
    assert "overlapping" in body["overlap_warning"]
    assert str(first["id"]) in body["overlap_warning"]


def test_patch_confirm_warns_when_existing_confirmed_event_is_a_null_ends_at_point(client):
    # The already-confirmed event is itself a point (null ends_at); the event being
    # confirmed now has an explicit span that contains that point. Locks in that
    # find_overlap's null-ends_at fallback (end = ends_at or starts_at) applies
    # symmetrically to both sides of the comparison, not just the new item.
    trip_id = _make_trip(client)
    point = client.post(f"/api/trips/{trip_id}/events", json=EVENT_PAYLOAD).json()
    client.patch(f"/api/trips/{trip_id}/events/{point['id']}", json={"status": "confirmed"})

    spanning = client.post(f"/api/trips/{trip_id}/events", json=EVENT_PAYLOAD_WITH_SPAN).json()

    res = client.patch(f"/api/trips/{trip_id}/events/{spanning['id']}", json={"status": "confirmed"})
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "confirmed"
    assert "overlapping" in body["overlap_warning"]
    assert str(point["id"]) in body["overlap_warning"]


def test_patch_confirm_does_not_warn_on_back_to_back_events(client):
    # inclusive=False: one event ending exactly when another starts is adjacent, not
    # an overlap (same convention as hotels' back-to-back check-out/check-in).
    trip_id = _make_trip(client)
    first = client.post(f"/api/trips/{trip_id}/events", json=EVENT_PAYLOAD_WITH_SPAN).json()
    client.patch(f"/api/trips/{trip_id}/events/{first['id']}", json={"status": "confirmed"})

    back_to_back_payload = {
        **EVENT_PAYLOAD_WITH_SPAN,
        "name": "Evening Mixer",
        "starts_at": "2026-10-01T17:00:00",
        "ends_at": "2026-10-01T19:00:00",
    }
    second = client.post(f"/api/trips/{trip_id}/events", json=back_to_back_payload).json()

    res = client.patch(f"/api/trips/{trip_id}/events/{second['id']}", json={"status": "confirmed"})
    assert res.status_code == 200
    assert res.json()["overlap_warning"] is None


def test_patch_confirm_does_not_warn_against_candidate_events(client):
    # Find_overlap only checks confirmed events - a still-candidate event
    # occupying the same window must not block confirming another.
    trip_id = _make_trip(client)
    client.post(f"/api/trips/{trip_id}/events", json=EVENT_PAYLOAD_WITH_SPAN)

    second = client.post(f"/api/trips/{trip_id}/events", json=EVENT_PAYLOAD).json()
    res = client.patch(f"/api/trips/{trip_id}/events/{second['id']}", json={"status": "confirmed"})
    assert res.status_code == 200
    assert res.json()["overlap_warning"] is None


def test_delete_removes_saved_event(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/events", json=EVENT_PAYLOAD).json()

    res = client.delete(f"/api/trips/{trip_id}/events/{saved['id']}")
    assert res.status_code == 204
    assert client.get(f"/api/trips/{trip_id}/events").json() == []


def test_deleting_trip_cascades_to_saved_events(client):
    trip_id = _make_trip(client)
    client.post(f"/api/trips/{trip_id}/events", json=EVENT_PAYLOAD)

    client.delete(f"/api/trips/{trip_id}")
    res = client.get(f"/api/trips/{trip_id}/events")
    assert res.status_code == 404


def test_save_rejects_non_iso_starts_at(client):
    trip_id = _make_trip(client)
    bad_payload = {**EVENT_PAYLOAD, "starts_at": "October 1 2026 3pm"}
    res = client.post(f"/api/trips/{trip_id}/events", json=bad_payload)
    assert res.status_code == 422


def test_save_rejects_non_iso_ends_at(client):
    trip_id = _make_trip(client)
    bad_payload = {**EVENT_PAYLOAD, "ends_at": "not-a-datetime"}
    res = client.post(f"/api/trips/{trip_id}/events", json=bad_payload)
    assert res.status_code == 422


def test_save_accepts_null_ends_at(client):
    # Discovered events routinely have no end time - treated as instantaneous, not required.
    trip_id = _make_trip(client)
    res = client.post(f"/api/trips/{trip_id}/events", json=EVENT_PAYLOAD)
    assert res.status_code == 201
    assert res.json()["ends_at"] is None


def test_save_accepts_null_price(client):
    # Discovered events carry no price field; custom events make cost optional.
    trip_id = _make_trip(client)
    res = client.post(f"/api/trips/{trip_id}/events", json=EVENT_PAYLOAD)
    assert res.status_code == 201
    assert res.json()["price"] is None


def test_save_accepts_custom_event_payload(client):
    trip_id = _make_trip(client)
    payload = {
        "source": "custom",
        "name": "Dinner with the Andersons",
        "location": "Home",
        "starts_at": "2026-10-02T19:00:00",
        "ends_at": "2026-10-02T21:00:00",
        "price": 0.0,
        "raw_payload": {"source": "custom"},
    }
    res = client.post(f"/api/trips/{trip_id}/events", json=payload)
    assert res.status_code == 201
    body = res.json()
    assert body["source"] == "custom"
    assert body["price"] == 0.0


def test_operations_on_missing_trip_return_404(client):
    assert client.get("/api/trips/999999/events").status_code == 404
    assert client.post("/api/trips/999999/events", json=EVENT_PAYLOAD).status_code == 404


def test_patch_missing_event_returns_404(client):
    trip_id = _make_trip(client)
    res = client.patch(f"/api/trips/{trip_id}/events/999999", json={"status": "confirmed"})
    assert res.status_code == 404


def test_deleting_confirmed_event_removes_calendar_entries(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/events", json=EVENT_PAYLOAD).json()
    client.patch(f"/api/trips/{trip_id}/events/{saved['id']}", json={"status": "confirmed"})
    assert len(client.get(f"/api/trips/{trip_id}/calendar").json()) == 1

    client.delete(f"/api/trips/{trip_id}/events/{saved['id']}")
    assert client.get(f"/api/trips/{trip_id}/calendar").json() == []


def test_deleting_candidate_event_removes_its_calendar_entries(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/events", json=EVENT_PAYLOAD).json()
    assert len(client.get(f"/api/trips/{trip_id}/calendar").json()) == 1

    res = client.delete(f"/api/trips/{trip_id}/events/{saved['id']}")
    assert res.status_code == 204
    assert client.get(f"/api/trips/{trip_id}/calendar").json() == []


def test_saving_candidate_event_creates_candidate_calendar_entry(client):
    # Events get a candidate stage too - candidates render on the calendar before
    # confirmation, same as flights/hotels/rentals.
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/events", json=EVENT_PAYLOAD_WITH_SPAN).json()

    entries = client.get(f"/api/trips/{trip_id}/calendar").json()
    assert len(entries) == 1
    assert entries[0]["status"] == "candidate"
    assert entries[0]["type"] == "event"
    assert entries[0]["source_type"] == "event"
    assert entries[0]["source_id"] == saved["id"]
    assert entries[0]["starts_at"] == EVENT_PAYLOAD_WITH_SPAN["starts_at"]
    assert entries[0]["ends_at"] == EVENT_PAYLOAD_WITH_SPAN["ends_at"]


def test_calendar_entry_ends_at_falls_back_to_starts_at_when_event_ends_at_is_null(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/events", json=EVENT_PAYLOAD).json()

    entries = client.get(f"/api/trips/{trip_id}/calendar").json()
    assert len(entries) == 1
    assert entries[0]["starts_at"] == EVENT_PAYLOAD["starts_at"]
    assert entries[0]["ends_at"] == EVENT_PAYLOAD["starts_at"]
    assert saved["ends_at"] is None  # the saved row itself keeps the true null


def test_confirming_event_updates_calendar_entry_in_place(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/events", json=EVENT_PAYLOAD).json()

    client.patch(f"/api/trips/{trip_id}/events/{saved['id']}", json={"status": "confirmed"})

    entries = client.get(f"/api/trips/{trip_id}/calendar").json()
    assert len(entries) == 1
    assert entries[0]["status"] == "confirmed"


def test_patch_edits_candidate_custom_event_and_resyncs_calendar_entry(client):
    trip_id = _make_trip(client)
    custom_payload = {
        "source": "custom",
        "name": "Dinner with the Andersons",
        "location": "Home",
        "starts_at": "2026-10-02T19:00:00",
        "ends_at": "2026-10-02T21:00:00",
        "price": 0.0,
        "raw_payload": {"source": "custom"},
    }
    saved = client.post(f"/api/trips/{trip_id}/events", json=custom_payload).json()

    res = client.patch(
        f"/api/trips/{trip_id}/events/{saved['id']}",
        json={"name": "Dinner with the Bakers", "starts_at": "2026-10-03T19:00:00"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["name"] == "Dinner with the Bakers"
    assert body["starts_at"] == "2026-10-03T19:00:00"
    assert body["status"] == "candidate"

    entries = client.get(f"/api/trips/{trip_id}/calendar").json()
    assert len(entries) == 1
    assert entries[0]["starts_at"] == "2026-10-03T19:00:00"


def test_patch_edit_rejected_for_search_sourced_event(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/events", json=EVENT_PAYLOAD).json()

    res = client.patch(f"/api/trips/{trip_id}/events/{saved['id']}", json={"name": "Nope"})
    assert res.status_code == 400


def test_deleting_trip_cascades_to_calendar_entries(client):
    trip_id = _make_trip(client)
    saved = client.post(f"/api/trips/{trip_id}/events", json=EVENT_PAYLOAD).json()
    client.patch(f"/api/trips/{trip_id}/events/{saved['id']}", json={"status": "confirmed"})

    client.delete(f"/api/trips/{trip_id}")

    entries = client.get("/api/calendar").json()
    assert all(e["trip_id"] != trip_id for e in entries)
