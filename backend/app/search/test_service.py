from datetime import datetime, timedelta, timezone

from app.search import service as cache
from app.search.models import SearchCache

FLIGHT_PARAMS = {"from": "SFO", "to": "JFK", "depart": "2026-06-22", "return": "", "travelers": 1}
FLIGHT_RESULTS = {"best_flights": [{"price": 412.5, "airline": "United"}]}


def test_get_cached_returns_none_when_nothing_stored(db_session):
    assert cache.get_cached(db_session, "serpapi_flights", FLIGHT_PARAMS) is None


def test_store_then_get_cached_returns_the_stored_response(db_session):
    cache.store(db_session, "serpapi_flights", FLIGHT_PARAMS, FLIGHT_RESULTS)
    assert cache.get_cached(db_session, "serpapi_flights", FLIGHT_PARAMS) == FLIGHT_RESULTS


def test_different_params_are_different_cache_keys(db_session):
    cache.store(db_session, "serpapi_flights", FLIGHT_PARAMS, FLIGHT_RESULTS)
    other_params = {**FLIGHT_PARAMS, "to": "LAX"}
    assert cache.get_cached(db_session, "serpapi_flights", other_params) is None


def test_param_key_order_does_not_affect_cache_hit(db_session):
    cache.store(db_session, "serpapi_flights", FLIGHT_PARAMS, FLIGHT_RESULTS)
    reordered = dict(reversed(list(FLIGHT_PARAMS.items())))
    assert cache.get_cached(db_session, "serpapi_flights", reordered) == FLIGHT_RESULTS


def test_different_providers_do_not_share_a_cache_entry(db_session):
    cache.store(db_session, "serpapi_flights", FLIGHT_PARAMS, FLIGHT_RESULTS)
    assert cache.get_cached(db_session, "serpapi_hotels", FLIGHT_PARAMS) is None


def test_expired_entry_is_treated_as_a_cache_miss(db_session):
    cache.store(db_session, "serpapi_flights", FLIGHT_PARAMS, FLIGHT_RESULTS)
    db_session.query(SearchCache).update(
        {"expires_at": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()}
    )
    db_session.commit()

    assert cache.get_cached(db_session, "serpapi_flights", FLIGHT_PARAMS) is None


def test_store_sets_expiry_using_the_configured_ttl_env_var(db_session, monkeypatch):
    monkeypatch.setenv("SEARCH_CACHE_TTL_HOURS", "2")
    cache.store(db_session, "serpapi_flights", FLIGHT_PARAMS, FLIGHT_RESULTS)

    row = db_session.query(SearchCache).one()
    fetched_at = datetime.fromisoformat(row.fetched_at)
    expires_at = datetime.fromisoformat(row.expires_at)
    assert expires_at - fetched_at == timedelta(hours=2)


def test_store_defaults_to_a_six_hour_ttl_when_env_var_is_unset(db_session, monkeypatch):
    monkeypatch.delenv("SEARCH_CACHE_TTL_HOURS", raising=False)
    cache.store(db_session, "serpapi_flights", FLIGHT_PARAMS, FLIGHT_RESULTS)

    row = db_session.query(SearchCache).one()
    fetched_at = datetime.fromisoformat(row.fetched_at)
    expires_at = datetime.fromisoformat(row.expires_at)
    assert expires_at - fetched_at == timedelta(hours=6)


def test_store_overwrites_the_existing_entry_for_the_same_key_instead_of_duplicating(db_session):
    cache.store(db_session, "serpapi_flights", FLIGHT_PARAMS, FLIGHT_RESULTS)
    newer_results = {"best_flights": [{"price": 399.0, "airline": "Delta"}]}
    cache.store(db_session, "serpapi_flights", FLIGHT_PARAMS, newer_results)

    assert db_session.query(SearchCache).count() == 1
    assert cache.get_cached(db_session, "serpapi_flights", FLIGHT_PARAMS) == newer_results
