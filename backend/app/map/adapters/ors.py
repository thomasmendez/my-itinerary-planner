import logging
import os

import httpx

logger = logging.getLogger(__name__)

ORS_DIRECTIONS_URL = "https://api.heigit.org/openrouteservice/v2/directions/{profile}/geojson"
ORS_GEOCODE_URL = "https://api.heigit.org/pelias/v1/search"


class OrsError(Exception):
    """A failed OpenRouteService call. The message is written to be safe to show an end
    user as-is; the full upstream status/body is logged separately, server-side only."""


class OrsConfigError(OrsError):
    """OpenRouteService rejected the configured API key - an operator-fixable
    misconfiguration, not something the end user can act on."""


class RouteNotFoundError(OrsError):
    """OpenRouteService understood the request but found no route (e.g. a coordinate
    sits too far from any road it knows about) - a real result, not a failure."""


def _handle_ors_status_error(err: httpx.HTTPStatusError, action: str) -> None:
    """Logs the full upstream failure and raises the typed error matching it. Always
    raises; return type is None only because Python has no bottom type for this."""
    status = err.response.status_code
    try:
        body = err.response.json()
    except ValueError:
        body = err.response.text
    logger.warning("OpenRouteService %s failed: %s %s", action, status, body)
    if status == 403:
        raise OrsConfigError("OpenRouteService rejected the configured API key") from err
    raise OrsError(f"OpenRouteService {action} request failed ({status})") from err


def get_route(coordinates: list[tuple[float, float]], profile: str = "driving-car") -> dict:
    """coordinates are (latitude, longitude) pairs in visiting order. Returns
    OpenRouteService's GeoJSON response unmodified - Leaflet consumes it natively.

    radiuses=-1 (unlimited) per point: an IATA airport's reference point often sits
    well outside ORS's default 350m snap-to-road radius (e.g. DEN is ~1.9km from the
    nearest routable road), which would otherwise 404 as "no routable point"."""
    try:
        response = httpx.post(
            ORS_DIRECTIONS_URL.format(profile=profile),
            headers={"Authorization": os.environ["ORS_API_KEY"]},
            json={
                "coordinates": [[lon, lat] for lat, lon in coordinates],
                "radiuses": [-1] * len(coordinates),
            },
            timeout=15,
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as err:
        # 404 here means ORS's own "no routable point/route" result (error code 2010 and
        # relatives), confirmed against the live API - not a missing endpoint - so it
        # gets its own type instead of falling into the generic upstream-failure bucket.
        if err.response.status_code == 404:
            logger.warning("OpenRouteService directions failed: 404 %s", err.response.text)
            raise RouteNotFoundError("No route could be found between the given points") from err
        _handle_ors_status_error(err, "directions")
    except httpx.HTTPError as err:
        logger.warning("OpenRouteService directions request failed: %r", err)
        raise OrsError("OpenRouteService directions request failed") from err
    return response.json()


def geocode_location(query: str) -> tuple[float, float] | None:
    """Resolves a free-text location to (latitude, longitude) via ORS's Pelias-based
    geocode/search endpoint - same API key and provider as get_route. A no-match is a
    normal 200 with an empty features list (Pelias never 404s for "not found")."""
    try:
        response = httpx.get(
            ORS_GEOCODE_URL,
            params={"api_key": os.environ["ORS_API_KEY"], "text": query, "size": 1},
            timeout=10,
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as err:
        _handle_ors_status_error(err, "geocode")
    except httpx.HTTPError as err:
        logger.warning("OpenRouteService geocode request failed: %r", err)
        raise OrsError("OpenRouteService geocode request failed") from err
    features = response.json()["features"]
    if not features:
        return None
    lon, lat = features[0]["geometry"]["coordinates"]
    return float(lat), float(lon)
