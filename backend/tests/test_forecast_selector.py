import pandas as pd

from app.services.forecast_selector import select_latest_before_cutoff


def ts(s):
    return pd.Timestamp(s, tz="UTC")


def test_latest_forecast_before_cutoff_is_chosen():
    # Delivery slot: 2 Jan 12:00. Cutoff: 1 Jan 09:00 (London = UTC in January).
    rows = [
        (ts("2026-01-02 12:00"), ts("2026-01-01 08:00"), 100.0),
        (ts("2026-01-02 12:00"), ts("2026-01-01 09:00"), 200.0),  # exactly at cutoff: allowed
        (ts("2026-01-02 12:00"), ts("2026-01-01 09:01"), 300.0),  # after cutoff: ignored
        (ts("2026-01-02 12:00"), ts("2026-01-02 06:00"), 400.0),  # after cutoff: ignored
    ]
    df = pd.DataFrame(rows, columns=["startTime", "publishTime", "generation"])
    out = select_latest_before_cutoff(df)
    assert len(out) == 1
    assert out.loc[0, "forecast"] == 200.0
    assert out.loc[0, "delivery_date"] == "2026-01-02"


def test_each_slot_gets_its_own_forecast():
    rows = [
        (ts("2026-01-02 12:00"), ts("2026-01-01 08:00"), 100.0),
        (ts("2026-01-03 12:00"), ts("2026-01-01 08:00"), 500.0),
        (ts("2026-01-03 12:00"), ts("2026-01-02 08:30"), 600.0),  # before 3 Jan's cutoff
    ]
    df = pd.DataFrame(rows, columns=["startTime", "publishTime", "generation"])
    out = select_latest_before_cutoff(df).set_index("delivery_date")
    assert out.loc["2026-01-02", "forecast"] == 100.0
    assert out.loc["2026-01-03", "forecast"] == 600.0


def test_slot_with_only_late_forecasts_is_dropped():
    rows = [(ts("2026-01-02 12:00"), ts("2026-01-01 10:00"), 100.0)]
    df = pd.DataFrame(rows, columns=["startTime", "publishTime", "generation"])
    assert select_latest_before_cutoff(df).empty