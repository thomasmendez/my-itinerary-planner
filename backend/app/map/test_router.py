from app.map.router import CONFIG_ERROR_DETAIL

AUSTIN_COORDS = (30.2672, -97.7431)
DALLAS_COORDS = (32.7767, -96.7970)

RENTAL_PAYLOAD = {
    "source": "custom",
    "description": "Rented SUV",
    "pickup_location": "Austin, Texas",
    "pickup_at": "2026-10-01T10:00:00+00:00",
    "dropoff_at": "2026-10-03T10:00:00+00:00",
    "raw_payload": {},
}


def _make_trip(client):
    return client.post("/api/trips", json={"name": "Texas Trip"}).json()["id"]


def _stub_ors_geocode(monkeypatch, coords_by_query):
    monkeypatch.setenv("ORS_API_KEY", "test-key")

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

    monkeypatch.setattr("app.map.adapters.ors.httpx.get", fake_get)


def test_get_map_points_returns_geocoded_saved_items(client, monkeypatch):
    _stub_ors_geocode(monkeypatch, {"Austin, Texas": AUSTIN_COORDS})
    trip_id = _make_trip(client)
    client.post(f"/api/trips/{trip_id}/rentals", json=RENTAL_PAYLOAD)

    res = client.get(f"/api/trips/{trip_id}/map/points")

    assert res.status_code == 200
    points = res.json()
    assert len(points) == 1
    assert points[0]["source_type"] == "saved_rental"
    assert points[0]["status"] == "candidate"
    assert points[0]["latitude"] == AUSTIN_COORDS[0]
    assert points[0]["longitude"] == AUSTIN_COORDS[1]


def test_get_map_points_for_missing_trip_returns_404(client):
    assert client.get("/api/trips/999999/map/points").status_code == 404


def test_get_route_proxies_to_openrouteservice(client, monkeypatch):
    trip_id = _make_trip(client)
    monkeypatch.setenv("ORS_API_KEY", "test-key")
    captured = {}

    def fake_post(url, headers=None, json=None, timeout=None):
        captured["json"] = json

        class FakeResponse:
            def raise_for_status(self):
                pass

            def json(self):
                return {"type": "FeatureCollection", "features": []}

        return FakeResponse()

    monkeypatch.setattr("app.map.adapters.ors.httpx.post", fake_post)

    res = client.post(
        f"/api/trips/{trip_id}/map/route",
        json={"points": [{"latitude": AUSTIN_COORDS[0], "longitude": AUSTIN_COORDS[1]},
                          {"latitude": DALLAS_COORDS[0], "longitude": DALLAS_COORDS[1]}]},
    )

    assert res.status_code == 200
    assert res.json() == {"type": "FeatureCollection", "features": []}
    assert captured["json"]["coordinates"] == [
        [AUSTIN_COORDS[1], AUSTIN_COORDS[0]],
        [DALLAS_COORDS[1], DALLAS_COORDS[0]],
    ]


def test_get_route_for_missing_trip_returns_404(client):
    res = client.post(
        "/api/trips/999999/map/route",
        json={"points": [{"latitude": 1.0, "longitude": 2.0}, {"latitude": 3.0, "longitude": 4.0}]},
    )
    assert res.status_code == 404


def test_get_route_upstream_failure_returns_502(client, monkeypatch):
    trip_id = _make_trip(client)
    monkeypatch.setenv("ORS_API_KEY", "test-key")

    import httpx

    def failing_post(url, headers=None, json=None, timeout=None):
        raise httpx.ConnectError("connection failed")

    monkeypatch.setattr("app.map.adapters.ors.httpx.post", failing_post)

    res = client.post(
        f"/api/trips/{trip_id}/map/route",
        json={"points": [{"latitude": 1.0, "longitude": 2.0}, {"latitude": 3.0, "longitude": 4.0}]},
    )
    assert res.status_code == 502
    assert res.json()["detail"] == "Map service is temporarily unavailable - try again shortly."


def test_get_route_with_unroutable_points_returns_422(client, monkeypatch):
    trip_id = _make_trip(client)
    monkeypatch.setenv("ORS_API_KEY", "test-key")

    import httpx

    def failing_post(url, headers=None, json=None, timeout=None):
        response = httpx.Response(
            404,
            json={"error": {"code": 2010, "message": "Could not find routable point"}},
            request=httpx.Request("POST", url),
        )
        response.raise_for_status()

    monkeypatch.setattr("app.map.adapters.ors.httpx.post", failing_post)

    res = client.post(
        f"/api/trips/{trip_id}/map/route",
        json={"points": [{"latitude": 1.0, "longitude": 2.0}, {"latitude": 3.0, "longitude": 4.0}]},
    )
    assert res.status_code == 422
    assert res.json()["detail"] == "No route could be found between the selected locations."


def test_get_route_with_rejected_api_key_returns_503_config_error(client, monkeypatch):
    trip_id = _make_trip(client)
    monkeypatch.setenv("ORS_API_KEY", "rejected-key")

    import httpx

    def failing_post(url, headers=None, json=None, timeout=None):
        response = httpx.Response(
            403,
            json={"error": "Access to this API has been disallowed"},
            request=httpx.Request("POST", url),
        )
        response.raise_for_status()

    monkeypatch.setattr("app.map.adapters.ors.httpx.post", failing_post)

    res = client.post(
        f"/api/trips/{trip_id}/map/route",
        json={"points": [{"latitude": 1.0, "longitude": 2.0}, {"latitude": 3.0, "longitude": 4.0}]},
    )
    assert res.status_code == 503
    assert res.json()["detail"] == CONFIG_ERROR_DETAIL


def test_get_route_without_api_key_returns_503_config_error(client, monkeypatch):
    trip_id = _make_trip(client)
    monkeypatch.delenv("ORS_API_KEY", raising=False)

    res = client.post(
        f"/api/trips/{trip_id}/map/route",
        json={"points": [{"latitude": 1.0, "longitude": 2.0}, {"latitude": 3.0, "longitude": 4.0}]},
    )

    assert res.status_code == 503
    assert "ORS_API_KEY" in res.json()["detail"]


def test_get_map_points_without_api_key_returns_503_config_error(client, monkeypatch):
    monkeypatch.delenv("ORS_API_KEY", raising=False)
    trip_id = _make_trip(client)
    client.post(f"/api/trips/{trip_id}/rentals", json=RENTAL_PAYLOAD)

    res = client.get(f"/api/trips/{trip_id}/map/points")

    assert res.status_code == 503
    assert "ORS_API_KEY" in res.json()["detail"]


def test_get_map_points_upstream_failure_returns_502(client, monkeypatch):
    monkeypatch.setenv("ORS_API_KEY", "test-key")
    trip_id = _make_trip(client)
    client.post(f"/api/trips/{trip_id}/rentals", json=RENTAL_PAYLOAD)

    import httpx

    def failing_get(url, params=None, timeout=None):
        raise httpx.ConnectError("connection failed")

    monkeypatch.setattr("app.map.adapters.ors.httpx.get", failing_get)

    res = client.get(f"/api/trips/{trip_id}/map/points")

    assert res.status_code == 502
    assert res.json()["detail"] == "Map service is temporarily unavailable - try again shortly."


def test_get_map_points_with_rejected_api_key_returns_503_config_error(client, monkeypatch):
    monkeypatch.setenv("ORS_API_KEY", "rejected-key")
    trip_id = _make_trip(client)
    client.post(f"/api/trips/{trip_id}/rentals", json=RENTAL_PAYLOAD)

    import httpx

    def failing_get(url, params=None, timeout=None):
        response = httpx.Response(
            403,
            json={"error": "Access to this API has been disallowed"},
            request=httpx.Request("GET", url),
        )
        response.raise_for_status()

    monkeypatch.setattr("app.map.adapters.ors.httpx.get", failing_get)

    res = client.get(f"/api/trips/{trip_id}/map/points")

    assert res.status_code == 503
    assert res.json()["detail"] == CONFIG_ERROR_DETAIL
