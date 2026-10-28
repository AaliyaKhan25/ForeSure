"""Download the January 2026 data once and save it as CSV.

Run from the backend folder:  python -m scripts.fetch_january_data

The API then reads these files, so it never waits on Elexon at request time.
"""
from datetime import datetime, timedelta, timezone

from app import config
from app.services.elexon_client import fetch_wind_actuals, fetch_wind_forecasts


def main() -> None:
    if config.RAW_DIR.exists() and not config.RAW_DIR.is_dir():
        raise NotADirectoryError(
            f"Expected a directory at {config.RAW_DIR}, but a file exists there. "
            "Remove or rename that file before downloading data."
        )
    config.RAW_DIR.mkdir(parents=True, exist_ok=True)

    # Decisions on Jan 1..Jan 31 are for delivery on Jan 2..Feb 1.
    delivery_first = config.FIRST_DECISION_DAY + timedelta(days=1)
    delivery_last = config.LAST_DECISION_DAY + timedelta(days=1)

    print(f"Downloading wind actuals {delivery_first} to {delivery_last} ...")
    actuals = fetch_wind_actuals(delivery_first, delivery_last)
    actuals.to_csv(config.ACTUALS_CSV, index=False)
    print(f"  {len(actuals):,} rows -> {config.ACTUALS_CSV}")

    publish_from = datetime.combine(
        config.FIRST_DECISION_DAY - timedelta(days=config.FORECAST_LOOKBACK_DAYS),
        datetime.min.time(),
        tzinfo=timezone.utc,
    )
    publish_to = datetime.combine(
        delivery_last, datetime.min.time(), tzinfo=timezone.utc
    )
    print(f"Downloading wind forecasts published {publish_from:%Y-%m-%d} to {publish_to:%Y-%m-%d} ...")
    forecasts = fetch_wind_forecasts(publish_from, publish_to)
    forecasts.to_csv(config.FORECASTS_CSV, index=False)
    print(f"  {len(forecasts):,} rows -> {config.FORECASTS_CSV}")


if __name__ == "__main__":
    main()