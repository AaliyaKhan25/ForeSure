from typing import Literal, Optional

from pydantic import BaseModel


class DatesResponse(BaseModel):
    dates: list[str]


class Point(BaseModel):
    time: str
    forecast: float
    actual: Optional[float]
    lower: float
    upper: float


class ForecastResponse(BaseModel):
    date: str
    cutoff: str
    points: list[Point]


class BriefingResponse(BaseModel):
    date: str
    cutoff: str
    avg_forecast_mw: int
    confidence: Literal["high", "medium", "low"]
    buffer_mw: int


class HourError(BaseModel):
    hour: int
    mae: float


class CoveragePoint(BaseModel):
    buffer_mw: int
    covered_pct: float


class MetricsResponse(BaseModel):
    mae: float
    rmse: float
    bias: float
    n: int
    by_hour: list[HourError]
    coverage: list[CoveragePoint]