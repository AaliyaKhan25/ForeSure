"""Plain-English summary for one delivery day."""
from __future__ import annotations

import pandas as pd

from app import config


def build_briefing(day: pd.DataFrame, date: str) -> dict:
    avg_forecast = float(day["forecast"].mean())
    buffer_mw = int(round(float(day["buffer_hint"].mean()) / 50) * 50)

    ratio = buffer_mw / avg_forecast if avg_forecast > 0 else float("inf")
    if ratio < config.CONFIDENCE_HIGH_BELOW:
        confidence = "high"
    elif ratio < config.CONFIDENCE_MEDIUM_BELOW:
        confidence = "medium"
    else:
        confidence = "low"

    return {
        "date": date,
        "cutoff": day["cutoff"].iloc[0].strftime("%Y-%m-%dT%H:%M:%SZ"),
        "avg_forecast_mw": int(round(avg_forecast)),
        "confidence": confidence,
        "buffer_mw": buffer_mw,
    }