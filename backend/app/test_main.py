import logging

from fastapi.testclient import TestClient

from app.main import app


def test_health_reports_ors_configured_status(monkeypatch):
    monkeypatch.delenv("ORS_API_KEY", raising=False)
    with TestClient(app) as client:
        assert client.get("/health").json()["ors_configured"] is False

    monkeypatch.setenv("ORS_API_KEY", "test-key")
    with TestClient(app) as client:
        assert client.get("/health").json()["ors_configured"] is True


def test_missing_ors_api_key_logs_a_startup_warning(monkeypatch, caplog):
    monkeypatch.delenv("ORS_API_KEY", raising=False)

    with caplog.at_level(logging.WARNING):
        with TestClient(app):
            pass

    assert any("ORS_API_KEY" in record.message for record in caplog.records)


def test_configured_ors_api_key_logs_no_startup_warning(monkeypatch, caplog):
    monkeypatch.setenv("ORS_API_KEY", "test-key")

    with caplog.at_level(logging.WARNING):
        with TestClient(app):
            pass

    assert not any("ORS_API_KEY" in record.message for record in caplog.records)


def test_missing_serpapi_key_logs_a_startup_warning(monkeypatch, caplog):
    monkeypatch.delenv("SERPAPI_KEY", raising=False)

    with caplog.at_level(logging.WARNING):
        with TestClient(app):
            pass

    assert any("SERPAPI_KEY" in record.message for record in caplog.records)


def test_configured_serpapi_key_logs_no_startup_warning(monkeypatch, caplog):
    monkeypatch.setenv("SERPAPI_KEY", "test-key")

    with caplog.at_level(logging.WARNING):
        with TestClient(app):
            pass

    assert not any("SERPAPI_KEY" in record.message for record in caplog.records)


def test_missing_chat_provider_key_logs_a_startup_warning(monkeypatch, caplog):
    monkeypatch.setenv("CHAT_PROVIDER", "anthropic")
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)

    with caplog.at_level(logging.WARNING):
        with TestClient(app):
            pass

    assert any("ANTHROPIC_API_KEY" in record.message for record in caplog.records)


def test_configured_chat_provider_key_logs_no_startup_warning(monkeypatch, caplog):
    monkeypatch.setenv("CHAT_PROVIDER", "anthropic")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")

    with caplog.at_level(logging.WARNING):
        with TestClient(app):
            pass

    assert not any("ANTHROPIC_API_KEY" in record.message for record in caplog.records)


def test_blank_chat_provider_logs_a_startup_warning(monkeypatch, caplog):
    """CHAT_PROVIDER is no longer implicitly anthropic - a blank/unset value must
    surface as a startup warning rather than being silently treated as configured."""
    monkeypatch.setenv("CHAT_PROVIDER", "")

    with caplog.at_level(logging.WARNING):
        with TestClient(app):
            pass

    assert any("CHAT_PROVIDER" in record.message for record in caplog.records)


def test_ollama_chat_provider_needs_no_key_and_logs_no_startup_warning(monkeypatch, caplog):
    monkeypatch.setenv("CHAT_PROVIDER", "ollama")
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    with caplog.at_level(logging.WARNING):
        with TestClient(app):
            pass

    assert not any("CHAT_PROVIDER" in record.message for record in caplog.records)
