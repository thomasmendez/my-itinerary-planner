from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.map import service
from app.map.adapters.ors import OrsConfigError, OrsError, RouteNotFoundError
from app.map.adapters.ors import get_route as ors_get_route
from app.map.schemas import MapPointResponse, RouteRequest
from app.trips import service as trips_service

router = APIRouter(prefix="/api/trips/{trip_id}/map", tags=["map"])

CONFIG_ERROR_DETAIL = "Map feature is not configured: set ORS_API_KEY on the server to enable it."
UPSTREAM_ERROR_DETAIL = "Map service is temporarily unavailable - try again shortly."
NO_ROUTE_DETAIL = "No route could be found between the selected locations."


@router.get("/points", response_model=list[MapPointResponse])
def get_map_points(trip_id: int, db: Session = Depends(get_db)):
    trips_service.get_trip_or_404(db, trip_id)
    try:
        return service.list_trip_points(db, trip_id)
    except (KeyError, OrsConfigError) as err:
        raise HTTPException(status_code=503, detail=CONFIG_ERROR_DETAIL) from err
    except OrsError as err:
        raise HTTPException(status_code=502, detail=UPSTREAM_ERROR_DETAIL) from err


@router.post("/route")
def get_map_route(trip_id: int, payload: RouteRequest, db: Session = Depends(get_db)):
    trips_service.get_trip_or_404(db, trip_id)
    coordinates = [(p.latitude, p.longitude) for p in payload.points]
    try:
        return ors_get_route(coordinates, profile=payload.profile)
    except (KeyError, OrsConfigError) as err:
        raise HTTPException(status_code=503, detail=CONFIG_ERROR_DETAIL) from err
    # RouteNotFoundError before OrsError - it's a subclass, and gets its own status/detail.
    except RouteNotFoundError as err:
        raise HTTPException(status_code=422, detail=NO_ROUTE_DETAIL) from err
    except OrsError as err:
        raise HTTPException(status_code=502, detail=UPSTREAM_ERROR_DETAIL) from err
