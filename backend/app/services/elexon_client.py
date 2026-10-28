"""Download wind actuals (FUELHH) and wind forecasts (WINDFOR) from Elexon."""
from __future__ import annotations

import time
from datetime import date, datetime, timedelta

import httpx
import pandas as pd

from app import config


def _rows(payload):
    # Stream endpoints return a bare list; other endpoints wrap it as {"data": [...]}.
    return payload.get("data", []) if isinstance(payload, dict) else payload


def _get(client: httpx.Client, path: str, params: dict):
    last_error = None
    for attempt in range(4):
        try:
            response = client.get(path, params=params)
            response.raise_for_status()
            return _rows(response.json())
        except (httpx.HTTPError, ValueError) as exc:
            last_error = exc
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Elexon request failed: {path} {params}: {last_error}")


def _client() -> httpx.Client:
    return httpx.Client(
        base_url=config.ELEXON_BASE_URL,
        timeout=60,
        headers={"Accept": "application/json"},
    )


def fetch_wind_actuals(start: date, end: date) -> pd.DataFrame:
    """Half-hourly actual wind generation (MW) for settlement dates start..end."""
    frames = []
    with _client() as client:
        day = start
        while day <= end:
            window_end = min(day + timedelta(days=6), end)
            rows = _get(
                client,
                "/datasets/FUELHH/stream",
                {
                    "settlementDateFrom": day.isoformat(),
                    "settlementDateTo": window_end.isoformat(),
                    "fuelType": "WIND",
                },
            )
            frames.append(pd.DataFrame(rows))
            day = window_end + timedelta(days=1)

    df = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
    if df.empty:
        return pd.DataFrame(columns=["startTime", "generation"])
    if "fuelType" in df.columns:
        df = df[df["fuelType"] == "WIND"]
    df = df[["startTime", "generation"]].copy()
    df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
    df["generation"] = pd.to_numeric(df["generation"], errors="coerce")
    return df.drop_duplicates("startTime", keep="last").sort_values("startTime").reset_index(drop=True)


def fetch_wind_forecasts(publish_from: datetime, publish_to: datetime) -> pd.DataFrame:
    """Every wind forecast published between the two (UTC) datetimes."""
    fmt = "%Y-%m-%dT%H:%M:%SZ"
    frames = []
    with _client() as client:
        cursor = publish_from
        while cursor < publish_to:
            window_end = min(cursor + timedelta(days=2), publish_to)
            rows = _get(
                client,
                "/datasets/WINDFOR/stream",
                {
                    "publishDateTimeFrom": cursor.strftime(fmt),
                    "publishDateTimeTo": window_end.strftime(fmt),
                },
            )
            frames.append(pd.DataFrame(rows))
            cursor = window_end

    df = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
    if df.empty:
        return pd.DataFrame(columns=["startTime", "publishTime", "generation"])
    df = df[["startTime", "publishTime", "generation"]].copy()
    df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
    df["publishTime"] = pd.to_datetime(df["publishTime"], utc=True)
    df["generation"] = pd.to_numeric(df["generation"], errors="coerce")
    return (
        df.drop_duplicates(["startTime", "publishTime"], keep="last")
        .sort_values(["startTime", "publishTime"])
        .reset_index(drop=True)
    )