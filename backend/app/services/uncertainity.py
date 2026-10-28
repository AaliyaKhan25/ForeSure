"""Likely range around a forecast, from how wrong it has been at that hour of day."""
from __future__ import annotations

import pandas as pd

from app import config


def hourly_error_stats(joined: pd.DataFrame) -> pd.DataFrame:
    """Per local hour: low/high quantile of (actual - forecast) and the p80 absolute error."""
    df = joined.dropna(subset=["forecast", "actual"]).copy()
    df["hour"] = df["startTime"].dt.tz_convert(config.LOCAL_TZ).dt.hour
    df["miss"] = df["actual"] - df["forecast"]  # signed, from the buyer's side
    df["abs_miss"] = df["miss"].abs()
    g = df.groupby("hour")
    stats = pd.DataFrame(
        {
            "q_low": g["miss"].quantile(config.BAND_LOW_Q),
            "q_high": g["miss"].quantile(config.BAND_HIGH_Q),
            "p_abs": g["abs_miss"].quantile(config.BUFFER_COVERAGE_Q),
        }
    )
    return stats.reindex(range(24)).interpolate(limit_direction="both").fillna(0.0)


def add_band(joined: pd.DataFrame, stats: pd.DataFrame) -> pd.DataFrame:
    out = joined.copy()
    hour = out["startTime"].dt.tz_convert(config.LOCAL_TZ).dt.hour
    out["lower"] = (out["forecast"] + hour.map(stats["q_low"])).clip(lower=0)
    out["upper"] = out["forecast"] + hour.map(stats["q_high"])
    out["buffer_hint"] = hour.map(stats["p_abs"])
    return out