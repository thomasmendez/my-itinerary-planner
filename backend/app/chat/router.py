import logging
import os

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.chat.service import ChatNotConfiguredError, run_chat

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    # Client resends whatever `messages` came back last time, verbatim.
    messages: list[dict]
    # Trip open in the UI, so the model doesn't have to ask which trip.
    trip_id: int | None = None


@router.post("")
async def chat(payload: ChatRequest):
    try:
        appended = await run_chat(payload.messages, payload.trip_id)
    except ChatNotConfiguredError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except KeyError as exc:
        # Defensive fallback - ChatNotConfiguredError above should already catch this.
        raise HTTPException(status_code=500, detail=f"missing env var: {exc}") from exc
    except httpx.HTTPStatusError as exc:
        # e.g. an invalid API key reaching the provider and coming back as a 401.
        raise HTTPException(
            status_code=502,
            detail=f"{exc.request.url.host} returned {exc.response.status_code}: {exc.response.text}",
        ) from exc
    except httpx.TimeoutException as exc:
        timeout = os.environ.get("CHAT_TIMEOUT_SECONDS", "60")
        logger.exception("chat provider request timed out after %ss", timeout)
        raise HTTPException(
            status_code=502,
            detail=(
                f"provider request timed out after {timeout}s - raise CHAT_TIMEOUT_SECONDS "
                "in backend/.env for a slow local model."
            ),
        ) from exc
    except httpx.HTTPError as exc:
        # Connection refused, DNS, etc - no response to read a status/body from.
        logger.exception("chat provider request failed: %r", exc)
        raise HTTPException(status_code=502, detail=f"provider request failed: {exc}") from exc
    return {"messages": payload.messages + appended}
