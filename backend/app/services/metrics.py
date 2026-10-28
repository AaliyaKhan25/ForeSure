"""Forecast accuracy numbers. Error = forecast - actual (positive: forecast too high)."""
from __future__ import annotations

import math

import numpy as np
import pandas as pd

from app import config


def _clean(joined: pd.DataFrame) -> pd.DataFrame:
    df = joined.dropna(subset=["forecast", "actual"]).copy()
    df["error"] = df["forecast"] - df["actual"]
    df["abs_error"] = df["error"].abs()
    return df


def compute_metrics(joined: pd.DataFrame) -> dict:
    df = _clean(joined)
    if df.empty:
        return {"mae": 0.0, "rmse": 0.0, "bias": 0.0, "n": 0, "by_hour": [], "coverage": []}

    local_hour = df["startTime"].dt.tz_convert(config.LOCAL_TZ).dt.hour
    by_hour = df.groupby(local_hour)["abs_error"].mean().reindex(range(24), fill_value=0.0)

    p99 = float(np.percentile(df["abs_error"], 99))
    max_buffer = int(min(5000, max(500, math.ceil(p99 / 100) * 100)))
    coverage = [
        {
            "buffer_mw": b,
            "covered_pct": round(float((df["abs_error"] <= b).mean() * 100), 1),
        }
        for b in range(0, max_buffer + 1, 100)
    ]

    return {
        "mae": round(float(df["abs_error"].mean()), 1),
        "rmse": round(float(np.sqrt((df["error"] ** 2).mean())), 1),
        "bias": round(float(df["error"].mean()), 1),
        "n": int(len(df)),
        "by_hour": [{"hour": int(h), "mae": round(float(v), 1)} for h, v in by_hour.items()],
        "coverage": coverage,
    }