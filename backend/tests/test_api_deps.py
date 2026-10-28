import pandas as pd
import pytest
from fastapi import HTTPException

from app import config
from app.api import deps


def test_store_loads_forecasts_and_serves_delivery_day(tmp_path, monkeypatch):
    raw_dir = tmp_path / "raw"
    raw_dir.mkdir()
    timestamps = ["2026-01-02T00:00:00Z", "2026-01-02T00:30:00Z"]
    pd.DataFrame(
        {"startTime": timestamps, "generation": [100.0, 120.0]}
    ).to_csv(raw_dir / "actuals.csv", index=False)
    pd.DataFrame(
        {
            "startTime": timestamps,
            "publishTime": ["2026-01-01T08:00:00Z"] * 2,
            "generation": [110.0, 130.0],
        }
    ).to_csv(raw_dir / "forecasts.csv", index=False)

    monkeypatch.setattr(config, "RAW_DIR", raw_dir)
    monkeypatch.setattr(config, "ACTUALS_CSV", raw_dir / "actuals.csv")
    monkeypatch.setattr(config, "FORECASTS_CSV", raw_dir / "forecasts.csv")
    deps._load_store.cache_clear()
    try:
        store = deps.require_store()
        day = deps.require_day("2026-01-02")
    finally:
        deps._load_store.cache_clear()

    assert store.dates == ["2026-01-02"]
    assert len(day) == 2
    assert day["forecast"].tolist() == [110.0, 130.0]
    assert day["actual"].tolist() == [100.0, 120.0]
    assert day["cutoff"].iloc[0] == pd.Timestamp("2026-01-01T09:00:00Z")


def test_require_day_rejects_non_iso_date():
    with pytest.raises(HTTPException) as exc_info:
        deps.require_day("2026-1-2")

    assert exc_info.value.status_code == 422
