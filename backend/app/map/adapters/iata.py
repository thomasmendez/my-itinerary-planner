import csv
from functools import lru_cache
from pathlib import Path

# Vendored from OurAirports' public-domain airports.csv (https://ourairports.com/data/),
# trimmed to iata_code/latitude_deg/longitude_deg. Free-text geocoding (map/adapters/ors.py)
# resolves airport codes inconsistently, so a bundled lookup beats a network call here.
_DATA_PATH = Path(__file__).parent.parent / "data" / "iata_airports.csv"


@lru_cache(maxsize=1)
def _table() -> dict[str, tuple[float, float]]:
    with _DATA_PATH.open(newline="", encoding="utf-8") as f:
        return {
            row["iata_code"]: (float(row["latitude_deg"]), float(row["longitude_deg"])) for row in csv.DictReader(f)
        }


def lookup(code: str) -> tuple[float, float] | None:
    return _table().get(code.strip().upper())
