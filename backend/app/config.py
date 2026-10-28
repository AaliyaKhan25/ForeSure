"""All tunable assumptions live here, so they are easy to explain and change."""
import os
from datetime import date
from pathlib import Path
from zoneinfo import ZoneInfo

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = Path(os.getenv("DATA_DIR", BASE_DIR / "data"))
RAW_DIR = DATA_DIR / "raw"
ACTUALS_CSV = RAW_DIR / "actuals.csv"
FORECASTS_CSV = RAW_DIR / "forecasts.csv"

# Elexon Insights API: public, no key needed.
ELEXON_BASE_URL = os.getenv("ELEXON_BASE_URL", "https://data.elexon.co.uk/bmrs/api/v1")

LOCAL_TZ = ZoneInfo("Europe/London")

# ASSUMPTION: the day-ahead purchase decision is made at this local time on the day
# before delivery. Only forecasts published at or before this moment may be used.
CUTOFF_TIME = os.getenv("CUTOFF_TIME", "09:00")
CUTOFF_HOUR, CUTOFF_MINUTE = (int(x) for x in CUTOFF_TIME.split(":"))

# The brief: purchase decisions made in January 2026 (for delivery the next day).
FIRST_DECISION_DAY = date(2026, 1, 1)
LAST_DECISION_DAY = date(2026, 1, 31)

# How far back before the first decision day to download forecasts. Forecasts for a
# delivery day are published days in advance, so we need an earlier start.
FORECAST_LOOKBACK_DAYS = 14

# Likely range shown on the chart = middle 80% of past errors (10th to 90th percentile).
BAND_LOW_Q = 0.10
BAND_HIGH_Q = 0.90

# The suggested buffer covers this share of past errors.
BUFFER_COVERAGE_Q = 0.80

# Confidence rating: suggested buffer as a share of the day's average forecast.
CONFIDENCE_HIGH_BELOW = 0.15
CONFIDENCE_MEDIUM_BELOW = 0.30

CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",")]