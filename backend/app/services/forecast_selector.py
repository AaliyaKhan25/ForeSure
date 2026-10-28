"""Pick, for every half-hour, the latest forecast the buyer could have seen."""
from __future__ import annotations

import pandas as pd

from app import config


def delivery_date(start_times: pd.Series) -> pd.Series:
    """UK-local calendar date (YYYY-MM-DD) of each half-hour."""
    return start_times.dt.tz_convert(config.LOCAL_TZ).dt.strftime("%Y-%m-%d")


def cutoff_for(start_times: pd.Series) -> pd.Series:
    """Decision cutoff (UTC) for each half-hour: CUTOFF_TIME local, the day before."""
    local_day = (
        start_times.dt.tz_convert(config.LOCAL_TZ).dt.tz_localize(None).dt.normalize()
    )
    cutoff_local = (
        local_day
        - pd.Timedelta(days=1)
        + pd.Timedelta(hours=config.CUTOFF_HOUR, minutes=config.CUTOFF_MINUTE)
    )
    return cutoff_local.dt.tz_localize(
        config.LOCAL_TZ, ambiguous="NaT", nonexistent="shift_forward"
    ).dt.tz_convert("UTC")


def select_latest_before_cutoff(forecasts: pd.DataFrame) -> pd.DataFrame:
    """Latest forecast per startTime with publishTime <= that slot's cutoff.

    Forecasts published after the cutoff are dropped: the buyer could not have seen them.
    Returns startTime, forecast, publishTime, cutoff, horizon_hours, delivery_date.
    """
    f = forecasts.dropna(subset=["generation"]).copy()
    f["cutoff"] = cutoff_for(f["startTime"])
    f = f[f["publishTime"] <= f["cutoff"]]
    f = f.sort_values(["startTime", "publishTime"]).drop_duplicates("startTime", keep="last")
    f = f.rename(columns={"generation": "forecast"})
    f["horizon_hours"] = (f["startTime"] - f["publishTime"]) / pd.Timedelta(hours=1)
    f["delivery_date"] = delivery_date(f["startTime"])
    return f[
        ["startTime", "forecast", "publishTime", "cutoff", "horizon_hours", "delivery_date"]
    ].reset_index(drop=True)