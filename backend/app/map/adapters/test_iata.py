from app.map.adapters.iata import lookup


def test_looks_up_a_known_airport_code():
    lat, lon = lookup("AUS")
    assert lat == 30.197535
    assert lon == -97.662015


def test_is_case_and_whitespace_insensitive():
    assert lookup("aus") == lookup(" AUS ") == lookup("AUS")


def test_returns_none_for_an_unknown_code():
    assert lookup("ZZZ99") is None
