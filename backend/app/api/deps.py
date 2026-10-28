from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import pandas as pd
from fastapi import HTTPException

from app import config
from app.services.forecast_selector import select_latest_before_cutoff
from app.services.uncertainity import add_band, hourly_error_stats


@dataclass(frozen=True)
class ForecastStore:
    joined: pd.DataFrame
    dates: list[str]


def _read_csv(path: Path, required_columns: set[str]) -> pd.DataFrame:
    if not path.is_file():
        raise HTTPException(
            status_code=503,
            detail=f"Data file is missing: {path}. Run `python -m scripts.fetch_january_data` from the backend folder.",
        )

    frame = pd.read_csv(path)
    missing_columns = required_columns.difference(frame.columns)
    if missing_columns:
        missing = ", ".join(sorted(missing_columns))
        raise HTTPException(
            status_code=503,
            detail=f"Data file {path} is missing required columns: {missing}.",
        )
    return frame


@lru_cache(maxsize=1)
def _load_store() -> ForecastStore:
    if not config.RAW_DIR.is_dir():
        raise HTTPException(
            status_code=503,
            detail=f"Raw data directory is not available at {config.RAW_DIR}. Run `python -m scripts.fetch_january_data` from the backend folder.",
        )

    actuals = _read_csv(config.ACTUALS_CSV, {"startTime", "generation"})
    forecasts = _read_csv(
        config.FORECASTS_CSV, {"startTime", "publishTime", "generation"}
    )

    for frame, columns in (
        (actuals, ["startTime"]),
        (forecasts, ["startTime", "publishTime"]),
    ):
        for column in columns:
            frame[column] = pd.to_datetime(frame[column], utc=True, errors="coerce")
            if frame[column].isna().any():
                raise HTTPException(
                    status_code=503,
                    detail=f"Data file contains invalid timestamps in column {column}.",
                )

    actuals["generation"] = pd.to_numeric(actuals["generation"], errors="coerce")
    forecasts["generation"] = pd.to_numeric(
        forecasts["generation"], errors="coerce"
    )

    selected = select_latest_before_cutoff(forecasts)
    if selected.empty:
        raise HTTPException(
            status_code=503,
            detail="No eligible forecasts were found in the data files.",
        )

    joined = selected.merge(
        actuals.rename(columns={"generation": "actual"})[["startTime", "actual"]],
        on="startTime",
        how="left",
        validate="one_to_one",
    )
    joined = add_band(joined, hourly_error_stats(joined))
    dates = sorted(joined["delivery_date"].dropna().unique().tolist())
    return ForecastStore(joined=joined, dates=dates)


def require_store() -> ForecastStore:
    if config.RAW_DIR.exists() and not config.RAW_DIR.is_dir():
        raise HTTPException(
            status_code=503,
            detail=f"Expected a directory at {config.RAW_DIR}, but a file exists there. Remove or rename that file, then run `python -m scripts.fetch_january_data` from the backend folder.",
        )
    return _load_store()


def require_day(day: str) -> pd.DataFrame:
    try:
        parsed_day = pd.Timestamp(day)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=422, detail="date must be a valid date in YYYY-MM-DD format."
        ) from None

    if parsed_day.strftime("%Y-%m-%d") != day:
        raise HTTPException(
            status_code=422, detail="date must be a valid date in YYYY-MM-DD format."
        )

    result = require_store().joined
    result = result[result["delivery_date"] == day]
    if result.empty:
        raise HTTPException(status_code=404, detail=f"No forecast data for {day}.")
    return result.copy()
