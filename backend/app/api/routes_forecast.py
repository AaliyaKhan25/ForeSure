import pandas as pd
from fastapi import APIRouter

from app.api.deps import require_day, require_store
from app.models.schemas import DatesResponse, ForecastResponse

router = APIRouter()


def _num(value):
    return None if pd.isna(value) else round(float(value), 1)


@router.get("/dates", response_model=DatesResponse)
def dates():
    return {"dates": require_store().dates}


@router.get("/forecast", response_model=ForecastResponse)
def forecast(date: str):
    day = require_day(date)
    points = [
        {
            "time": row.startTime.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "forecast": round(float(row.forecast), 1),
            "actual": _num(row.actual),
            "lower": round(float(row.lower), 1),
            "upper": round(float(row.upper), 1),
        }
        for row in day.itertuples()
    ]
    return {
        "date": date,
        "cutoff": day["cutoff"].iloc[0].strftime("%Y-%m-%dT%H:%M:%SZ"),
        "points": points,
    }