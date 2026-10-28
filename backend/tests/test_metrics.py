import pandas as pd

from app.services.metrics import compute_metrics


def test_headline_metrics():
    t = pd.date_range("2026-01-02", periods=4, freq="30min", tz="UTC")
    joined = pd.DataFrame(
        {"startTime": t, "forecast": [110, 90, 100, 130], "actual": [100, 100, 100, 100]}
    )
    m = compute_metrics(joined)
    assert m["n"] == 4
    assert m["mae"] == 12.5          # (10 + 10 + 0 + 30) / 4
    assert m["bias"] == 7.5          # (10 - 10 + 0 + 30) / 4, positive = forecast too high
    assert round(m["rmse"], 1) == 16.6
    assert m["coverage"][0] == {"buffer_mw": 0, "covered_pct": 25.0}


def test_missing_actuals_are_ignored():
    t = pd.date_range("2026-01-02", periods=2, freq="30min", tz="UTC")
    joined = pd.DataFrame({"startTime": t, "forecast": [100, 200], "actual": [90, None]})
    assert compute_metrics(joined)["n"] == 1