import httpx
import pytest

from app.mcp import server as mcp


class _FakeResponse:
    def __init__(self, status_code, text):
        self.status_code = status_code
        self.text = text
        self.request = httpx.Request("POST", "https://api.anthropic.com/v1/messages")

    def raise_for_status(self):
        raise httpx.HTTPStatusError("error", request=self.request, response=self)  # type: ignore[arg-type]

    def json(self):
        return {}


@pytest.fixture(autouse=True)
def no_mcp_tools(monkeypatch):
    async def fake_list_tools():
        return []

    monkeypatch.setattr(mcp.mcp_server, "list_tools", fake_list_tools)


def test_missing_provider_api_key_returns_503_with_which_var(client, monkeypatch):
    monkeypatch.setenv("CHAT_PROVIDER", "anthropic")
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)

    res = client.post("/api/chat", json={"messages": [{"role": "user", "content": "hi"}]})

    assert res.status_code == 503
    assert "ANTHROPIC_API_KEY" in res.json()["detail"]


def test_blank_chat_provider_returns_503_with_helpful_message(client, monkeypatch):
    monkeypatch.setenv("CHAT_PROVIDER", "")

    res = client.post("/api/chat", json={"messages": [{"role": "user", "content": "hi"}]})

    assert res.status_code == 503
    assert "CHAT_PROVIDER" in res.json()["detail"]
    assert "anthropic" in res.json()["detail"]


def test_unrecognized_chat_provider_returns_503_with_helpful_message(client, monkeypatch):
    monkeypatch.setenv("CHAT_PROVIDER", "not-a-real-provider")

    res = client.post("/api/chat", json={"messages": [{"role": "user", "content": "hi"}]})

    assert res.status_code == 503
    assert "not-a-real-provider" in res.json()["detail"]


def test_provider_error_response_returns_502_with_status_and_body(client, monkeypatch):
    monkeypatch.setenv("CHAT_PROVIDER", "anthropic")
    # Present but wrong, as opposed to missing - chat_configuration_error() only checks
    # presence, so this clears that gate and reaches the provider, unlike an empty key.
    monkeypatch.setenv("ANTHROPIC_API_KEY", "wrong-key")

    async def fake_post(self, url, **kwargs):
        return _FakeResponse(401, '{"error": "invalid x-api-key"}')

    monkeypatch.setattr("httpx.AsyncClient.post", fake_post)

    res = client.post("/api/chat", json={"messages": [{"role": "user", "content": "hi"}]})

    assert res.status_code == 502
    assert "401" in res.json()["detail"]
    assert "invalid x-api-key" in res.json()["detail"]
