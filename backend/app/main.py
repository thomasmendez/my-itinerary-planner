# Provenance: 79257eac-aa27-4700-8fc7-9c70fbb93736
import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse

from app.calendar.router import router as calendar_router
from app.chat.router import router as chat_router
from app.chat.service import chat_configuration_error
from app.events.router import router as events_router
from app.flights.router import router as saved_flights_router
from app.hotels.router import router as saved_hotels_router
from app.map.router import router as map_router
from app.mcp.server import mcp_server
from app.rentals.router import router as saved_rentals_router
from app.search.router import router as search_router
from app.trips.router import router as trips_router

logger = logging.getLogger(__name__)

# MCP session manager teardown can hang on a stuck client connection
# (seen as a --reload/Ctrl+C deadlock needing kill -9). Bound it so that can't
# wedge the process; raise this if clean shutdowns start timing out for real.
_MCP_SHUTDOWN_TIMEOUT_SECONDS = 5

# StreamableHTTPSessionManager only run()s once per instance, but lifespan fires
# on every TestClient enter/exit in tests - rebuild the MCP app fresh each time.
_mcp_app_holder: dict = {}


async def _mcp_asgi(scope, receive, send):
    await _mcp_app_holder["app"](scope, receive, send)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not os.environ.get("SERPAPI_KEY"):
        logger.warning(
            "SERPAPI_KEY is not set - flight/hotel/event search will return dev fixture "
            "data instead of live results until a SerpApi key is configured."
        )
    if not os.environ.get("ORS_API_KEY"):
        logger.warning(
            "ORS_API_KEY is not set - the Map feature (routing and geocoding) will not work "
            "until an OpenRouteService API key is configured."
        )
    chat_error = chat_configuration_error()
    if chat_error:
        logger.warning(chat_error)
    _mcp_app_holder["app"] = mcp_server.streamable_http_app(streamable_http_path="/")
    session_manager_cm = mcp_server.session_manager.run()
    await session_manager_cm.__aenter__()
    try:
        yield
    finally:
        try:
            await asyncio.wait_for(
                session_manager_cm.__aexit__(None, None, None),
                timeout=_MCP_SHUTDOWN_TIMEOUT_SECONDS,
            )
        except TimeoutError:
            logger.warning(
                "MCP session manager shutdown exceeded %ss; abandoning stuck session(s) so the process can still exit.",
                _MCP_SHUTDOWN_TIMEOUT_SECONDS,
            )


app = FastAPI(lifespan=lifespan)
app.include_router(trips_router)
app.include_router(saved_flights_router)
app.include_router(saved_hotels_router)
app.include_router(saved_rentals_router)
app.include_router(events_router)
app.include_router(calendar_router)
app.include_router(map_router)
app.include_router(search_router)
app.include_router(chat_router)
app.mount("/mcp", _mcp_asgi)


@app.get("/health")
def health():
    return {"status": "ok", "ors_configured": bool(os.environ.get("ORS_API_KEY"))}


# Serves the built React SPA so one process/container handles API and UI.
# Absent in local dev (frontend runs via `vite dev`), so skip rather than fail import.
_STATIC_DIR = (Path(__file__).parent / "static").resolve()

if _STATIC_DIR.is_dir():

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str):
        # full_path is attacker-controlled; confine to _STATIC_DIR before is_file()
        # or "../../etc/passwd" escapes it.
        candidate = (_STATIC_DIR / full_path).resolve()
        if candidate.is_relative_to(_STATIC_DIR) and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(_STATIC_DIR / "index.html")
