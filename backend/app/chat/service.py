import json
import logging
import os

import httpx

from app.mcp.server import mcp_server

logger = logging.getLogger(__name__)

MAX_TOOL_ROUNDS = 5


def _resolve_chat_model(default: str) -> str:
    # A blank CHAT_MODEL= in .env.example sets the var to "" rather than unset,
    # which .get()'s default arg won't catch - treat blank as unset too.
    return os.environ.get("CHAT_MODEL") or default


async def _mcp_tool_specs() -> list[dict]:
    tools = await mcp_server.list_tools()
    return [{"name": t.name, "description": t.description or "", "schema": t.input_schema} for t in tools]


def _strip_raw_payload(value):
    # /api/chat is stateless - the client resends the whole history every request -
    # so drop raw_payload recursively rather than re-billing that blob every turn.
    if isinstance(value, dict):
        return {k: _strip_raw_payload(v) for k, v in value.items() if k != "raw_payload"}
    if isinstance(value, list):
        return [_strip_raw_payload(v) for v in value]
    return value


async def _call_mcp_tool(name: str, arguments: dict) -> str:
    # Let the model see and retry on a bad-args error instead of killing the request.
    try:
        result = await mcp_server.call_tool(name, arguments)
    except Exception as exc:
        return json.dumps({"is_error": True, "error": str(exc)})
    text = "\n".join(block.text for block in result.content if hasattr(block, "text"))
    if not text:
        return json.dumps({"is_error": result.is_error})
    try:
        parsed = json.loads(text)
    except ValueError:
        return text
    return json.dumps(_strip_raw_payload(parsed))


# --- provider adapters ------------------------------------------------------
# Each takes the running history + tool specs and returns {text, tool_calls,
# append} - append is the vendor's own message format, echoed back verbatim
# next round.


_CACHE_CONTROL = {"cache_control": {"type": "ephemeral"}}


def _with_cache_breakpoint(messages: list[dict]) -> list[dict]:
    # Marks the last block as an Anthropic cache breakpoint so the resent
    # history prefix is a cache read, not full-price input, after round one.
    if not messages:
        return messages
    *rest, last = messages
    content = last["content"]
    blocks = [{"type": "text", "text": content}] if isinstance(content, str) else list(content)
    blocks[-1] = {**blocks[-1], **_CACHE_CONTROL}
    return [*rest, {**last, "content": blocks}]


async def _anthropic_turn(
    client: httpx.AsyncClient, messages: list[dict], tools: list[dict], system: str | None
) -> dict:
    tool_specs = [{"name": t["name"], "description": t["description"], "input_schema": t["schema"]} for t in tools]
    if tool_specs:
        tool_specs[-1] = {**tool_specs[-1], **_CACHE_CONTROL}
    resp = await client.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": os.environ["ANTHROPIC_API_KEY"],
            "anthropic-version": "2023-06-01",
        },
        json={
            "model": _resolve_chat_model("claude-haiku-4-5-20251001"),
            "max_tokens": 1024,
            "messages": _with_cache_breakpoint(messages),
            "tools": tool_specs,
            **({"system": [{"type": "text", "text": system, **_CACHE_CONTROL}]} if system else {}),
        },
    )
    resp.raise_for_status()
    data = resp.json()
    usage = data.get("usage", {})
    logger.info(
        "anthropic turn usage: input=%s cache_read=%s cache_write=%s output=%s",
        usage.get("input_tokens"),
        usage.get("cache_read_input_tokens"),
        usage.get("cache_creation_input_tokens"),
        usage.get("output_tokens"),
    )
    text = "".join(b["text"] for b in data["content"] if b["type"] == "text")
    tool_calls = [
        {"id": b["id"], "name": b["name"], "arguments": b["input"]}
        for b in data["content"]
        if b["type"] == "tool_use"
    ]
    return {"text": text, "tool_calls": tool_calls, "append": [{"role": "assistant", "content": data["content"]}]}


def _anthropic_tool_results(tool_calls: list[dict], results: list[str]) -> list[dict]:
    return [{
        "role": "user",
        "content": [
            {"type": "tool_result", "tool_use_id": call["id"], "content": result}
            for call, result in zip(tool_calls, results, strict=True)
        ],
    }]


async def _openai_compatible_turn(
    client: httpx.AsyncClient, messages: list[dict], tools: list[dict], system: str | None,
    *, url: str, headers: dict, default_model: str,
) -> dict:
    # Shared by any provider on the OpenAI chat-completions wire format (OpenAI, Ollama).
    model = _resolve_chat_model(default_model)
    logger.info("chat turn: POST %s model=%s tools_offered=%d", url, model, len(tools))
    resp = await client.post(
        url,
        headers=headers,
        json={
            "model": model,
            "messages": ([{"role": "system", "content": system}] if system else []) + messages,
            "tools": [
                {
                    "type": "function",
                    "function": {
                        "name": t["name"],
                        "description": t["description"],
                        "parameters": t["schema"],
                    },
                }
                for t in tools
            ],
        },
    )
    resp.raise_for_status()
    msg = resp.json()["choices"][0]["message"]
    tool_calls = [
        {"id": c["id"], "name": c["function"]["name"], "arguments": json.loads(c["function"]["arguments"])}
        for c in msg.get("tool_calls", [])
    ]
    logger.info(
        "chat turn response: tool_calls=%s text_len=%d",
        [c["name"] for c in tool_calls],
        len(msg.get("content") or ""),
    )
    return {"text": msg.get("content") or "", "tool_calls": tool_calls, "append": [msg]}


async def _openai_turn(client: httpx.AsyncClient, messages: list[dict], tools: list[dict], system: str | None) -> dict:
    return await _openai_compatible_turn(
        client, messages, tools, system,
        url="https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}"},
        default_model="gpt-4.1",
    )


async def _ollama_turn(client: httpx.AsyncClient, messages: list[dict], tools: list[dict], system: str | None) -> dict:
    base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
    return await _openai_compatible_turn(
        client, messages, tools, system,
        url=f"{base_url}/v1/chat/completions",
        headers={},
        default_model="gemma4:e2b",
    )


def _openai_tool_results(tool_calls: list[dict], results: list[str]) -> list[dict]:
    return [
        {"role": "tool", "tool_call_id": call["id"], "content": result}
        for call, result in zip(tool_calls, results, strict=True)
    ]


PROVIDERS = {
    "anthropic": (_anthropic_turn, _anthropic_tool_results),
    "openai": (_openai_turn, _openai_tool_results),
    "ollama": (_ollama_turn, _openai_tool_results),
}

# Which env var each provider needs besides CHAT_PROVIDER - ollama needs none.
_PROVIDER_KEY_ENV = {
    "anthropic": "ANTHROPIC_API_KEY",
    "openai": "OPENAI_API_KEY",
}


class ChatNotConfiguredError(Exception):
    """CHAT_PROVIDER is unset, not recognized, or missing its provider's key."""


def chat_configuration_error() -> str | None:
    """None once chat is ready to try; otherwise a human-readable reason it isn't.
    Shared by run_chat() and main.py's startup warning."""
    provider_name = os.environ.get("CHAT_PROVIDER", "").strip()
    if not provider_name:
        return f"CHAT_PROVIDER is not set - set it to one of ({', '.join(PROVIDERS)}) in backend/.env to enable chat."
    if provider_name not in PROVIDERS:
        return (
            f"CHAT_PROVIDER={provider_name!r} is not a supported chat provider - "
            f"must be one of ({', '.join(PROVIDERS)})."
        )
    key_env = _PROVIDER_KEY_ENV.get(provider_name)
    if key_env and not os.environ.get(key_env):
        return f"CHAT_PROVIDER={provider_name} but {key_env} is not set - add it to backend/.env."
    return None


async def run_chat(messages: list[dict], trip_id: int | None = None) -> list[dict]:
    """Runs the provider <-> MCP tool loop and returns the provider-native turns
    to append; the client stores and resends these verbatim next time."""
    config_error = chat_configuration_error()
    if config_error:
        raise ChatNotConfiguredError(config_error)
    provider_name = os.environ["CHAT_PROVIDER"].strip()
    turn_fn, tool_results_fn = PROVIDERS[provider_name]

    # mcp_server.instructions is the top-level guidance MCP clients get on
    # initialize (no rental search tool -> custom form, confirm is UI-only) -
    # /api/chat bypasses that handshake, so without this every chat driver runs
    # tool-only with no way to know either fact.
    system_parts = [mcp_server.instructions] if mcp_server.instructions else []

    # Local models tend to close with a generic offer-to-help instead of reporting
    # the tool result - nudge only ollama. Covers both write calls (say what changed)
    # and read-only ones like get_calendar (report what was found, not "what changed",
    # since a read has nothing to change - that asymmetry is what caused the generic
    # filler in the first place).
    if provider_name == "ollama":
        system_parts.append(
            "After using tools, finish with a plain-language answer that reports the tool's "
            "actual result - for a save/update, say what changed; for a read (e.g. the "
            "calendar), state what you found, or that there was nothing in range - never a "
            "generic offer to help instead. When a search's results include ones that don't "
            "match what the user asked for (e.g. they named a topic or event type), list only "
            "the matching ones, not the full raw result set."
        )
    if trip_id is not None:
        system_parts.append(
            f"The user is currently viewing trip_id {trip_id}. Use it for any "
            "trip-scoped tool calls unless they name a different trip."
        )
    system = " ".join(system_parts) if system_parts else None
    tools = await _mcp_tool_specs()
    appended: list[dict] = []

    # Operator-configurable: local Ollama inference on CPU can take minutes.
    timeout = float(os.environ.get("CHAT_TIMEOUT_SECONDS", 60))
    logger.info("chat request: provider=%s timeout=%ss", provider_name, timeout)
    async with httpx.AsyncClient(timeout=timeout) as client:
        exhausted = True
        for _ in range(MAX_TOOL_ROUNDS):
            result = await turn_fn(client, messages + appended, tools, system)
            appended += result["append"]
            if not result["tool_calls"]:
                exhausted = False
                break
            results = [await _call_mcp_tool(c["name"], c["arguments"]) for c in result["tool_calls"]]
            appended += tool_results_fn(result["tool_calls"], results)

        # Ran out of rounds mid-tool-call: force one tools-disabled turn so the
        # response doesn't end on a bare tool result with no text for the user.
        if exhausted:
            result = await turn_fn(client, messages + appended, [], system)
            appended += result["append"]

    return appended
