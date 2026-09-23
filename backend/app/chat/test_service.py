import json

import pytest

from app.chat import service
from app.mcp import server as mcp

pytestmark = pytest.mark.anyio


@pytest.fixture
def anyio_backend():
    return "asyncio"


class _FakeTool:
    name = "list_trips"
    description = "List all trips."
    input_schema = {"type": "object", "properties": {}}


class _FakeContent:
    def __init__(self, text):
        self.text = text


class _FakeCallToolResult:
    content = [_FakeContent('[{"id": 1, "name": "Iceland"}]')]
    is_error = False


class _FakeResponse:
    def __init__(self, body):
        self._body = body

    def raise_for_status(self):
        pass

    def json(self):
        return self._body


TOOL_USE_TURN = {
    "stop_reason": "tool_use",
    "content": [{"type": "tool_use", "id": "call_1", "name": "list_trips", "input": {}}],
}
FINAL_TURN = {
    "stop_reason": "end_turn",
    "content": [{"type": "text", "text": "You have one trip: Iceland."}],
}


async def test_run_chat_executes_the_requested_tool_then_returns_final_text(monkeypatch):
    monkeypatch.setenv("CHAT_PROVIDER", "anthropic")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")

    async def fake_list_tools():
        return [_FakeTool()]

    calls = []

    async def fake_call_tool(name, arguments):
        calls.append((name, arguments))
        return _FakeCallToolResult()

    responses = iter([TOOL_USE_TURN, FINAL_TURN])

    async def fake_post(self, url, **kwargs):
        return _FakeResponse(next(responses))

    monkeypatch.setattr(mcp.mcp_server, "list_tools", fake_list_tools)
    monkeypatch.setattr(mcp.mcp_server, "call_tool", fake_call_tool)
    monkeypatch.setattr("httpx.AsyncClient.post", fake_post)

    appended = await service.run_chat([{"role": "user", "content": "what trips do I have?"}])

    assert calls == [("list_trips", {})]
    assert appended[-1]["content"][0]["text"] == "You have one trip: Iceland."
    # tool result round-tripped back to Anthropic in its expected shape
    tool_result_turn = next(m for m in appended if m["role"] == "user")
    assert tool_result_turn["content"][0]["tool_use_id"] == "call_1"


async def test_run_chat_forces_final_text_when_round_budget_exhausted(monkeypatch):
    """If the model keeps requesting tools past MAX_TOOL_ROUNDS, the loop must not
    end on a bare tool_result - it should force one tools-disabled turn so there's
    always closing text for the user."""
    monkeypatch.setenv("CHAT_PROVIDER", "anthropic")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")
    monkeypatch.setattr(service, "MAX_TOOL_ROUNDS", 2)

    async def fake_list_tools():
        return [_FakeTool()]

    async def fake_call_tool(name, arguments):
        return _FakeCallToolResult()

    def fake_post_factory():
        calls = {"n": 0}

        async def fake_post(self, url, **kwargs):
            calls["n"] += 1
            # every round asks for another tool, except the forced final turn,
            # which is identified by an empty tools list in the request body.
            if not kwargs["json"]["tools"]:
                return _FakeResponse(FINAL_TURN)
            return _FakeResponse(TOOL_USE_TURN)

        return fake_post

    monkeypatch.setattr(mcp.mcp_server, "list_tools", fake_list_tools)
    monkeypatch.setattr(mcp.mcp_server, "call_tool", fake_call_tool)
    monkeypatch.setattr("httpx.AsyncClient.post", fake_post_factory())

    appended = await service.run_chat([{"role": "user", "content": "keep going forever"}])

    last_assistant_turn = [m for m in appended if m["role"] == "assistant"][-1]
    assert last_assistant_turn["content"][0]["type"] == "text"
    assert last_assistant_turn["content"][0]["text"] == "You have one trip: Iceland."


async def test_run_chat_marks_anthropic_cache_breakpoints(monkeypatch):
    """system, tools, and the last history block should each carry
    cache_control so repeated resends of the (large) history and the (fixed)
    tool schemas are cache reads, not full-price input tokens."""
    monkeypatch.setenv("CHAT_PROVIDER", "anthropic")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")

    async def fake_list_tools():
        return [_FakeTool()]

    async def fake_call_tool(name, arguments):
        return _FakeCallToolResult()

    requests = []

    async def fake_post(self, url, **kwargs):
        requests.append(kwargs["json"])
        return _FakeResponse(FINAL_TURN)

    monkeypatch.setattr(mcp.mcp_server, "list_tools", fake_list_tools)
    monkeypatch.setattr(mcp.mcp_server, "call_tool", fake_call_tool)
    monkeypatch.setattr("httpx.AsyncClient.post", fake_post)

    await service.run_chat([{"role": "user", "content": "what trips do I have?"}], trip_id=7)

    body = requests[0]
    assert body["tools"][-1]["cache_control"] == {"type": "ephemeral"}
    assert body["system"][-1]["cache_control"] == {"type": "ephemeral"}
    assert body["messages"][-1]["content"][-1]["cache_control"] == {"type": "ephemeral"}


async def test_run_chat_includes_mcp_instructions_in_system_prompt(monkeypatch):
    """mcp_server.instructions carries guidance /api/chat has no other way to
    deliver (no rental search tool -> custom form, confirm is UI-only) - every
    driver needs it, not just ollama."""
    monkeypatch.setenv("CHAT_PROVIDER", "anthropic")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")

    async def fake_list_tools():
        return [_FakeTool()]

    async def fake_call_tool(name, arguments):
        return _FakeCallToolResult()

    requests = []

    async def fake_post(self, url, **kwargs):
        requests.append(kwargs["json"])
        return _FakeResponse(FINAL_TURN)

    monkeypatch.setattr(mcp.mcp_server, "list_tools", fake_list_tools)
    monkeypatch.setattr(mcp.mcp_server, "call_tool", fake_call_tool)
    monkeypatch.setattr("httpx.AsyncClient.post", fake_post)

    await service.run_chat([{"role": "user", "content": "find me a rental car"}])

    assert mcp.mcp_server.instructions in requests[0]["system"][0]["text"]


OPENAI_SHAPED_TOOL_USE_TURN = {
    "choices": [{"message": {
        "role": "assistant",
        "tool_calls": [{"id": "call_1", "type": "function", "function": {"name": "list_trips", "arguments": "{}"}}],
    }}]
}
OPENAI_SHAPED_FINAL_TURN = {
    "choices": [{"message": {"role": "assistant", "content": "You have one trip: Iceland."}}]
}


async def test_run_chat_with_ollama_hits_configured_base_url_needing_no_key(monkeypatch):
    """Ollama speaks the same wire format as OpenAI (_openai_compatible_turn is
    shared) but needs no API key and its URL comes from OLLAMA_BASE_URL rather
    than being hardcoded - this pins both of those down."""
    monkeypatch.setenv("CHAT_PROVIDER", "ollama")
    monkeypatch.setenv("OLLAMA_BASE_URL", "http://ollama-box:11434")
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    async def fake_list_tools():
        return [_FakeTool()]

    async def fake_call_tool(name, arguments):
        return _FakeCallToolResult()

    requests = []
    responses = iter([OPENAI_SHAPED_TOOL_USE_TURN, OPENAI_SHAPED_FINAL_TURN])

    async def fake_post(self, url, **kwargs):
        requests.append((url, kwargs))
        return _FakeResponse(next(responses))

    monkeypatch.setattr(mcp.mcp_server, "list_tools", fake_list_tools)
    monkeypatch.setattr(mcp.mcp_server, "call_tool", fake_call_tool)
    monkeypatch.setattr("httpx.AsyncClient.post", fake_post)

    appended = await service.run_chat([{"role": "user", "content": "what trips do I have?"}])

    assert requests[0][0] == "http://ollama-box:11434/v1/chat/completions"
    assert "headers" in requests[0][1] and requests[0][1]["headers"] == {}
    assert appended[-1]["content"] == "You have one trip: Iceland."
    tool_result_turn = next(m for m in appended if m.get("role") == "tool")
    assert tool_result_turn["tool_call_id"] == "call_1"


def test_resolve_chat_model_uses_default_when_unset(monkeypatch):
    monkeypatch.delenv("CHAT_MODEL", raising=False)

    assert service._resolve_chat_model("provider-default") == "provider-default"


def test_resolve_chat_model_uses_default_when_blank(monkeypatch):
    """A `CHAT_MODEL=` line in an env file sets the var to an empty string, not
    unset - this is the actual footgun `.env.example` used to hit by shipping a
    concrete (Anthropic-only) default: switch CHAT_PROVIDER without touching
    CHAT_MODEL and the old value would silently carry over to the new provider."""
    monkeypatch.setenv("CHAT_MODEL", "")

    assert service._resolve_chat_model("provider-default") == "provider-default"


def test_resolve_chat_model_uses_explicit_override_when_set(monkeypatch):
    monkeypatch.setenv("CHAT_MODEL", "custom-model")

    assert service._resolve_chat_model("provider-default") == "custom-model"


async def test_run_chat_with_ollama_falls_back_to_its_own_default_model_when_chat_model_is_blank(monkeypatch):
    """Same edge case as test_resolve_chat_model_uses_default_when_blank, pinned through
    the full request: a blank CHAT_MODEL (as opposed to unset) must not send an empty
    model name to Ollama."""
    monkeypatch.setenv("CHAT_PROVIDER", "ollama")
    monkeypatch.setenv("OLLAMA_BASE_URL", "http://ollama-box:11434")
    monkeypatch.setenv("CHAT_MODEL", "")
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    async def fake_list_tools():
        return [_FakeTool()]

    async def fake_call_tool(name, arguments):
        return _FakeCallToolResult()

    requests = []

    async def fake_post(self, url, **kwargs):
        requests.append(kwargs["json"])
        return _FakeResponse(OPENAI_SHAPED_FINAL_TURN)

    monkeypatch.setattr(mcp.mcp_server, "list_tools", fake_list_tools)
    monkeypatch.setattr(mcp.mcp_server, "call_tool", fake_call_tool)
    monkeypatch.setattr("httpx.AsyncClient.post", fake_post)

    await service.run_chat([{"role": "user", "content": "what trips do I have?"}])

    assert requests[0]["model"] == "gemma4:e2b"


def test_chat_configuration_error_when_provider_unset(monkeypatch):
    monkeypatch.delenv("CHAT_PROVIDER", raising=False)

    error = service.chat_configuration_error()

    assert error is not None
    assert "CHAT_PROVIDER" in error
    assert "anthropic" in error and "openai" in error and "ollama" in error


def test_chat_configuration_error_when_provider_blank(monkeypatch):
    """A `CHAT_PROVIDER=` line sets the var to an empty string, not unset - same
    footgun as CHAT_MODEL, must be treated the same as fully unset."""
    monkeypatch.setenv("CHAT_PROVIDER", "")

    assert service.chat_configuration_error() is not None


def test_chat_configuration_error_when_provider_unrecognized(monkeypatch):
    monkeypatch.setenv("CHAT_PROVIDER", "not-a-real-provider")

    error = service.chat_configuration_error()

    assert error is not None
    assert "not-a-real-provider" in error


def test_chat_configuration_error_when_provider_key_missing(monkeypatch):
    monkeypatch.setenv("CHAT_PROVIDER", "anthropic")
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)

    error = service.chat_configuration_error()

    assert error is not None
    assert "ANTHROPIC_API_KEY" in error


def test_chat_configuration_error_when_fully_configured(monkeypatch):
    monkeypatch.setenv("CHAT_PROVIDER", "openai")
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")

    assert service.chat_configuration_error() is None


def test_chat_configuration_error_ollama_needs_no_key(monkeypatch):
    monkeypatch.setenv("CHAT_PROVIDER", "ollama")
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    assert service.chat_configuration_error() is None


async def test_run_chat_raises_chat_not_configured_error_not_key_error(monkeypatch):
    monkeypatch.setenv("CHAT_PROVIDER", "")

    with pytest.raises(service.ChatNotConfiguredError):
        await service.run_chat([{"role": "user", "content": "hi"}])


def test_strip_raw_payload_drops_the_key_at_any_depth():
    """Unit-level pin on the recursion itself: list_saved_flights/list_saved_hotels/
    list_events return a JSON array of saved items, each carrying raw_payload -
    the dict-only case is covered end-to-end below, this covers the list-of-dicts shape."""
    saved_items = [
        {"id": 1, "price": 450, "raw_payload": {"extensions": ["big blob"], "price": 450}},
        {"id": 2, "price": 900, "raw_payload": {"extensions": ["big blob"], "price": 900}},
    ]

    stripped = service._strip_raw_payload(saved_items)

    assert stripped == [{"id": 1, "price": 450}, {"id": 2, "price": 900}]


class _FakeSaveResult:
    is_error = False

    def __init__(self, payload):
        self.content = [_FakeContent(json.dumps(payload))]


async def test_run_chat_strips_raw_payload_before_it_enters_resent_history(monkeypatch):
    """save_flight_candidate embeds the full SerpApi entry in raw_payload so it can be
    persisted - but /api/chat is stateless, so whatever lands in `appended` here is what
    the client stores and resends verbatim on every future turn. Without stripping,
    that blob gets rebilled in full on every request for the rest of the conversation."""
    monkeypatch.setenv("CHAT_PROVIDER", "anthropic")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")

    saved_flight = {
        "id": 1,
        "trip_id": 1,
        "status": "candidate",
        "price": 450,
        "raw_payload": {"flights": [{"airline": "Icelandair"}], "extensions": ["huge blob"] * 50},
    }

    async def fake_list_tools():
        return [_FakeTool()]

    async def fake_call_tool(name, arguments):
        return _FakeSaveResult(saved_flight)

    responses = iter([TOOL_USE_TURN, FINAL_TURN])

    async def fake_post(self, url, **kwargs):
        return _FakeResponse(next(responses))

    monkeypatch.setattr(mcp.mcp_server, "list_tools", fake_list_tools)
    monkeypatch.setattr(mcp.mcp_server, "call_tool", fake_call_tool)
    monkeypatch.setattr("httpx.AsyncClient.post", fake_post)

    appended = await service.run_chat([{"role": "user", "content": "save that flight"}])

    tool_result_turn = next(m for m in appended if m["role"] == "user")
    result_text = tool_result_turn["content"][0]["content"]
    assert "raw_payload" not in result_text
    assert json.loads(result_text) == {"id": 1, "trip_id": 1, "status": "candidate", "price": 450}
