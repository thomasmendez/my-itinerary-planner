import httpx
import pytest

from app.map.adapters.ors import OrsConfigError, OrsError, RouteNotFoundError, geocode_location, get_route


def _raising_response(status_code: int, **kwargs):
    """Builds a real httpx.Response and returns the httpx.HTTPStatusError its own
    raise_for_status() raises - so tests exercise the real exception shape (.response
    with a real status_code/json()/text) instead of a hand-rolled stand-in."""
    response = httpx.Response(status_code, request=httpx.Request("GET", "https://example.test"), **kwargs)
    try:
        response.raise_for_status()
    except httpx.HTTPStatusError as err:
        return err
    raise AssertionError(f"{status_code} did not raise")


def test_posts_coordinates_in_lon_lat_order_and_returns_geojson(monkeypatch):
    monkeypatch.setenv("ORS_API_KEY", "test-key")
    captured = {}

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"type": "FeatureCollection", "features": [{"type": "Feature"}]}

    def fake_post(url, headers=None, json=None, timeout=None):
        captured["url"] = url
        captured["headers"] = headers
        captured["json"] = json
        return FakeResponse()

    monkeypatch.setattr("app.map.adapters.ors.httpx.post", fake_post)

    result = get_route([(30.6153718, -97.6961649), (32.8998, -97.0403)])

    assert result == {"type": "FeatureCollection", "features": [{"type": "Feature"}]}
    assert captured["headers"]["Authorization"] == "test-key"
    # ORS expects [lon, lat] pairs - the reverse of the (lat, lon) tuples this
    # adapter takes, matching how every other part of this app orders coordinates.
    assert captured["json"]["coordinates"] == [[-97.6961649, 30.6153718], [-97.0403, 32.8998]]
    # -1 (unlimited) per point - an airport's IATA reference point can legitimately sit
    # far from any road, and ORS's default 350m snap radius rejects those as unroutable.
    assert captured["json"]["radiuses"] == [-1, -1]
    assert "driving-car" in captured["url"]


def test_get_route_raises_route_not_found_on_404(monkeypatch):
    monkeypatch.setenv("ORS_API_KEY", "test-key")

    def fake_post(url, headers=None, json=None, timeout=None):
        raise _raising_response(404, json={"error": {"code": 2010, "message": "no routable point"}})

    monkeypatch.setattr("app.map.adapters.ors.httpx.post", fake_post)

    with pytest.raises(RouteNotFoundError):
        get_route([(30.0, -97.0), (32.0, -97.0)])


def test_get_route_raises_config_error_on_403(monkeypatch):
    monkeypatch.setenv("ORS_API_KEY", "rejected-key")

    def fake_post(url, headers=None, json=None, timeout=None):
        raise _raising_response(403, json={"error": "Access to this API has been disallowed"})

    monkeypatch.setattr("app.map.adapters.ors.httpx.post", fake_post)

    with pytest.raises(OrsConfigError):
        get_route([(30.0, -97.0), (32.0, -97.0)])


def test_get_route_raises_generic_ors_error_on_other_status(monkeypatch):
    monkeypatch.setenv("ORS_API_KEY", "test-key")

    def fake_post(url, headers=None, json=None, timeout=None):
        raise _raising_response(500, text="internal error")

    monkeypatch.setattr("app.map.adapters.ors.httpx.post", fake_post)

    with pytest.raises(OrsError):
        get_route([(30.0, -97.0), (32.0, -97.0)])


def test_get_route_includes_unlimited_radiuses(monkeypatch):
    monkeypatch.setenv("ORS_API_KEY", "test-key")
    captured = {}

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"type": "FeatureCollection", "features": []}

    def fake_post(url, headers=None, json=None, timeout=None):
        captured["json"] = json
        return FakeResponse()

    monkeypatch.setattr("app.map.adapters.ors.httpx.post", fake_post)

    get_route([(30.0, -97.0), (32.0, -97.0), (33.0, -98.0)])

    assert captured["json"]["radiuses"] == [-1, -1, -1]


def test_geocode_raises_config_error_on_403(monkeypatch):
    monkeypatch.setenv("ORS_API_KEY", "rejected-key")

    def fake_get(url, params=None, timeout=None):
        raise _raising_response(403, json={"error": "Access to this API has been disallowed"})

    monkeypatch.setattr("app.map.adapters.ors.httpx.get", fake_get)

    with pytest.raises(OrsConfigError):
        geocode_location("Austin, Texas")


def test_raises_when_api_key_missing(monkeypatch):
    monkeypatch.delenv("ORS_API_KEY", raising=False)

    with pytest.raises(KeyError):
        get_route([(30.0, -97.0), (32.0, -97.0)])


def test_geocode_returns_lat_lon_from_first_feature(monkeypatch):
    monkeypatch.setenv("ORS_API_KEY", "test-key")
    captured = {}

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"features": [{"geometry": {"coordinates": [-97.6961649, 30.6153718]}}]}

    def fake_get(url, params=None, timeout=None):
        captured["params"] = params
        return FakeResponse()

    monkeypatch.setattr("app.map.adapters.ors.httpx.get", fake_get)

    result = geocode_location("Austin, Texas")

    assert result == (30.6153718, -97.6961649)
    assert captured["params"]["text"] == "Austin, Texas"
    assert captured["params"]["api_key"] == "test-key"


def test_geocode_returns_none_when_no_features(monkeypatch):
    monkeypatch.setenv("ORS_API_KEY", "test-key")

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"features": []}

    monkeypatch.setattr("app.map.adapters.ors.httpx.get", lambda url, params=None, timeout=None: FakeResponse())

    assert geocode_location("someplace that does not exist") is None
