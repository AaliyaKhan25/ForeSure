# ForeSure

**A decision-support dashboard for day-ahead wind generation.**

ForeSure brings together a wind-generation forecast, a transparent decision-time cutoff, historical forecast error, and observed generation. It is designed to help energy buyers inspect the uncertainty around a forecast—not to replace a trading, dispatch, or procurement decision.

> **Scope:** This repository contains a working prototype built around a fixed January 2026 sample. It is not a live forecasting service, a calibrated probabilistic model, or a recommendation to buy a particular volume of energy.

## Table of contents

- [Problem and product goals](#problem-and-product-goals)
- [Architecture](#architecture)
- [Data source and processing](#data-source-and-processing)
- [Forecast-selection and uncertainty methodology](#forecast-selection-and-uncertainty-methodology)
- [API reference](#api-reference)
- [Technology and repository layout](#technology-and-repository-layout)
- [Prerequisites](#prerequisites)
- [Run locally](#run-locally)
- [Run with Docker Compose](#run-with-docker-compose)
- [Deploy to Vercel](#deploy-to-vercel)
- [Configuration](#configuration)
- [Testing and validation](#testing-and-validation)
- [Operational notes and troubleshooting](#operational-notes-and-troubleshooting)
- [Known limitations and next steps](#known-limitations-and-next-steps)
- [AI-assisted development](#ai-assisted-development)

## Problem and product goals

Wind output changes over time, and a single forecast value hides both the forecast's historical behavior and the possibility of a miss. ForeSure makes that context inspectable:

- **Day-ahead briefing:** average forecast generation, a suggested historical error buffer, a relative confidence label, and the decision cutoff.
- **Half-hour profile:** forecast, historical error range, and actual generation on the same timeline. Actuals are displayed whenever the source observation exists; missing observations remain missing.
- **Performance context:** mean absolute error (MAE), root mean squared error (RMSE), signed bias, hourly MAE, and empirical buffer coverage.
- **Daily analysis:** buyer-oriented summaries of output, peaks, ramps, dayparts, forecast error, and actual-versus-forecast comparisons.
- **Method and knowledge pages:** explanations of terms, assumptions, and limitations.
- **Buyer feedback:** an optional preference is stored in the user's browser only; the survey does not submit data to a server.

The interface uses a small hash-based router (`#/briefing`, `#/accuracy`, `#/method`, and `#/knowledge`) and a shared site shell. A reduced-motion preference is respected by the route transition and the interactive background.

## Architecture

```text
                         Build time                         Runtime
                    ┌─────────────────┐
                    │ React + Vite     │
                    │ static assets   │
                    └────────┬────────┘
                             │ frontend image
                             ▼
Browser ── HTTP ──► NGINX (static SPA + /api reverse proxy)
                             │ /api/*
                             ▼
                    FastAPI / Uvicorn ── reads ──► CSV data
                             ▲                       │
                             │                       │ named volume in Compose
                             │                       │ or backend/app/data locally
                             │                       │
                    Elexon BMRS API ◄── one-off fetch script
```

### Request lifecycle

1. The browser loads the React single-page application. NGINX serves built assets and falls back to `index.html` for client-side routes.
2. The frontend requests dates and aggregate metrics, then requests a briefing and forecast for the selected delivery day.
3. FastAPI loads the two CSV files, validates the required columns and timestamps, selects a forecast per delivery interval, limits delivery dates to January 2–February 1 (the days corresponding to January 1–31 decision dates), joins observations, and derives historical error statistics.
4. The resulting data store is cached in-process (`lru_cache(maxsize=1)`) and reused by API handlers. The API does not call Elexon while serving a normal dashboard request.
5. In Docker Compose, NGINX resolves `backend` through the Compose network. Only the frontend port is published to the host; the backend port is internal to the Compose network.

### Service boundaries

| Component | Responsibility | Runtime interface |
|---|---|---|
| React + Vite | Routing, charts, buyer-facing summaries, loading and demo-data indication | Static files served by NGINX |
| NGINX | Static asset delivery, SPA fallback, same-origin API proxy | Host port `8080` by default |
| FastAPI + Uvicorn | CSV validation, forecast selection, joins, metrics, and JSON responses | Internal port `8000`; not host-published by Compose |
| Fetch script | Retrieve historical forecast and actual records from Elexon and write CSVs | One-off command; not a scheduled service |
| Named volume | Persist fetched CSVs independently of backend container lifecycle | Compose volume `foresure-data` |

## Data source and processing

The fetcher uses the public [Elexon BMRS API](https://data.elexon.co.uk/bmrs/api/v1):

| Dataset | Purpose | Fields used |
|---|---|---|
| `WINDFOR` | Published wind-generation forecasts | `startTime`, `publishTime`, `generation` |
| `FUELHH` | Half-hourly observed wind generation | `startTime`, `generation`; filtered to `fuelType == "WIND"` when supplied |

No Elexon API key is configured by this application. The client uses bounded date windows, a 60-second request timeout, and up to four attempts per request, with a linear delay between retries. A terminal request failure raises an exception instead of silently producing a successful-looking download.

The fetch script's configured decision period is **January 1–31, 2026**. Each decision day concerns delivery on the following day, so the resulting delivery coverage is **January 2–February 1, 2026**. Forecast publications are fetched from 14 days before the first decision day through the last delivery day to cover forecasts published ahead of delivery.

The checked-in sample currently contains 1,488 actual rows and 26,280 forecast rows. The fetcher writes:

```text
<DATA_DIR>/
└── raw/
    ├── actuals.csv       # startTime, generation
    └── forecasts.csv     # startTime, publishTime, generation
```

The sample has half-hour intervals. A typical UK day has 48 half-hour periods, but the API derives available delivery dates and does not synthesize missing intervals or observations.

### Data loading and missing values

- Timestamps are parsed as UTC; unparseable timestamps make the data unavailable with an HTTP `503` response.
- Forecast and actual `generation` values are converted to numeric values; unparseable values become null.
- A left join by UTC `startTime` preserves selected forecast intervals even when an actual observation is absent.
- Missing actuals are returned as JSON `null`. They are not replaced with the forecast, interpolated, or included in error metrics.
- The API validates required columns before building its in-memory store. It does not currently enforce a complete interval count, freshness SLA, or source-data schema version.
- The store is cached for the lifetime of the Python process. After replacing CSV files, restart the backend to ensure it reloads them.

## Forecast-selection and uncertainty methodology

### Decision-time forecast selection

The decision cutoff defaults to **09:00 Europe/London local time on the day before delivery**. For each delivery interval:

1. Convert its UTC `startTime` to the UK local calendar date.
2. Construct the preceding day's cutoff in `Europe/London`, then convert the cutoff to UTC.
3. Discard publications later than the cutoff.
4. Select the remaining row with the greatest `publishTime` for that `startTime`.
5. Calculate `horizon_hours` as the interval start minus the selected publication time.

A publication exactly at the cutoff is eligible. A later publication is excluded, even if it is available in the downloaded historical dataset. This prevents a retrospective analysis from using information published after the assumed buyer decision point.

### Error metrics

For each paired forecast and actual observation, define signed error as:

```text
error = forecast - actual
```

Therefore positive bias indicates over-forecasting and negative bias indicates under-forecasting.

| Metric | Calculation | Interpretation |
|---|---|---|
| MAE | Mean of `abs(error)` | Typical absolute miss |
| RMSE | Square root of mean `error²` | Gives large misses greater weight |
| Bias | Mean of `error` | Direction and average size of forecast lean |
| Hourly MAE | Mean absolute error grouped by UK local hour | Historical variation in error by hour of day |
| Buffer coverage | Percentage with `abs(error) <= buffer_mw` | Empirical share of observed historical intervals covered by a chosen buffer |

`n` in `/api/metrics` is the number of paired forecast/actual intervals used for these metrics. Missing actuals are excluded.

### Historical range and suggested buffer

- For each UK local hour, the **likely range** is formed from the 10th and 90th percentiles of `actual - forecast`. The offsets are added to each forecast; the lower edge is clipped at zero.
- For each UK local hour, the **buffer estimate** is the 80th percentile of absolute historical error.
- The briefing averages the hourly buffer estimates for the selected day and rounds that mean to the nearest 50 MW.
- The confidence label compares the rounded buffer with the day's average forecast: `high` below 15%, `medium` below 30%, and `low` otherwise.

These are descriptive heuristics over the available historical sample. The range is **not** a calibrated 80% prediction interval, and the confidence label is **not** a statistical confidence score. Since the current range and accuracy summaries are derived from the same selected January sample they describe, they are in-sample indicators—not independent out-of-sample validation.

## API reference

All application endpoints use the `/api` prefix. Responses are JSON.

| Method and path | Purpose | Success response |
|---|---|---|
| `GET /api/health` | Process-level health probe | `{"status":"ok"}` |
| `GET /api/dates` | Available UK-local delivery dates | `{"dates":["2026-01-02", "..."]}` |
| `GET /api/forecast?date=YYYY-MM-DD` | Half-hour forecast, range, and actuals for one delivery day | Date, cutoff, and `points` array |
| `GET /api/briefing?date=YYYY-MM-DD` | Summary and suggested buffer for one delivery day | Date, cutoff, average MW, confidence, buffer MW |
| `GET /api/metrics` | Historical error metrics over the loaded sample | MAE, RMSE, bias, sample count, hourly MAE, coverage |

Example forecast response (values abbreviated):

```json
{
  "date": "2026-01-02",
  "cutoff": "2026-01-01T09:00:00Z",
  "points": [
    {
      "time": "2026-01-02T00:00:00Z",
      "forecast": 10000.0,
      "actual": 9800.0,
      "lower": 9200.0,
      "upper": 10800.0
    }
  ]
}
```

`actual` is nullable. `time` and `cutoff` are serialized as UTC timestamps ending in `Z`. Values are in MW. The forecast route returns the intervals present in the selected data; it does not fill gaps.

### Error behavior

- `422 Unprocessable Entity`: malformed date; dates must be strict `YYYY-MM-DD`.
- `404 Not Found`: valid date with no available selected forecast data.
- `503 Service Unavailable`: missing data directory/files, required columns missing, invalid timestamps, or no eligible forecasts.

FastAPI's interactive API documentation is available at `http://localhost:8000/docs` when running the backend directly. The Compose deployment does not publish port `8000`; its public NGINX proxy only forwards `/api/` paths.

## Technology and repository layout

| Area | Technologies |
|---|---|
| Frontend | React 18, Vite 5, Recharts 2 |
| API | Python 3.12 container, FastAPI, Uvicorn |
| Data and calculations | pandas, NumPy |
| HTTP client | httpx |
| Frontend container | Node 20 build stage, NGINX Alpine runtime |
| Orchestration | Docker Compose |
| Tests | pytest |

```text
.
├── backend/
│   ├── app/
│   │   ├── api/                 # HTTP routes and shared data-loading dependencies
│   │   ├── data/raw/            # Elexon CSV input (or DATA_DIR/raw at runtime)
│   │   ├── models/              # Pydantic response contracts
│   │   ├── services/            # Elexon client, forecast selector, metrics, briefing
│   │   ├── config.py            # Data paths, timezone, cutoff, analysis assumptions
│   │   └── main.py              # FastAPI app, CORS, health endpoint, route registration
│   ├── scripts/fetch_january_data.py
│   ├── tests/                   # Selector, metrics, and data-loading tests
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/api/                 # API client and deterministic demo-data fallback
│   ├── src/components/          # Charts, navigation, shared UI
│   ├── src/hooks/               # Data loading and hash routing
│   ├── src/pages/               # Dashboard and consumer knowledge base
│   ├── dockerfile               # Vite build stage + NGINX runtime
│   ├── nginx.conf               # SPA fallback and backend API reverse proxy
│   └── package.json
└── docker-compose.yml
```

## Prerequisites

For local development:

- Python **3.12** is recommended to match the backend container.
- Node.js **20** and npm.
- Network access to Elexon only when running the data-fetch script.

For the containerized deployment, install Docker Engine or Docker Desktop with the Compose plugin.

## Run locally

The repository includes sample CSV data. To use it, start the API and frontend in separate terminals.

### 1. Start the backend

From the repository root in PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API is available at `http://localhost:8000`, and interactive documentation is at `http://localhost:8000/docs`.

To download a fresh copy of the configured January sample, stop the API if it is running, then run this from the `backend` directory:

```powershell
python -m scripts.fetch_january_data
```

The script overwrites the two CSV files under `backend/app/data/raw` by default. It requires network access to Elexon. Restart the backend after downloading so the process-level cached data store is rebuilt.

### 2. Start the frontend

In another terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to `http://localhost:8000` by default, keeping the browser requests same-origin during development. Set `VITE_API_PROXY` before starting Vite to target a different backend origin.

### Production frontend build

```powershell
cd frontend
npm ci
npm run build
```

Vite writes the production bundle to `frontend/dist`. The build currently reports a JavaScript chunk-size warning; it does not fail the build.

## Run with Docker Compose

Run these commands from the repository root.

### Build images

```powershell
docker compose build
```

The frontend image builds the Vite application in a Node 20 stage, then copies only the generated static assets into an NGINX image. The backend image installs Python dependencies and starts Uvicorn on container port `8000`.

### Fetch data into the persistent volume

Do this before starting the dashboard for the first time:

```powershell
docker compose run --rm backend python -m scripts.fetch_january_data
```

Compose mounts the named `foresure-data` volume at `/data`, and the backend receives `DATA_DIR=/data`. Therefore the fetch command writes `/data/raw/actuals.csv` and `/data/raw/forecasts.csv` into the same persistent volume used by the API container.

### Start and inspect

```powershell
docker compose up -d
docker compose ps
docker compose logs -f backend frontend
```

Open `http://localhost:8080`. Verify the proxied API at `http://localhost:8080/api/health`; check data availability with `http://localhost:8080/api/dates`.

The Compose health check currently probes `/api/health`, which confirms that the FastAPI process responds. It does **not** validate the CSV files. Fetch the data before startup to avoid API `503` responses or the frontend's visible demo-data fallback.

### Stop and preserve data

```powershell
docker compose down
```

This removes containers and the default Compose network but retains `foresure-data`. To intentionally remove the downloaded data too:

```powershell
docker compose down --volumes
```

For a public host, set `FRONTEND_PORT=80` in a root `.env` file and put a TLS-terminating reverse proxy or load balancer in front of the frontend. Restrict inbound traffic to the intended web ports, keep port `8000` private, and establish backups for the named data volume.

## Deploy to Vercel

The root [`vercel.json`](./vercel.json) configures ForeSure as one Vercel project with two services, following Vercel's [Vite + FastAPI services example](https://github.com/vercel/examples/tree/de867239d0a7dd55c9130f1e3f87fcf877db96e8/services/vite-fastapi):

- **`frontend`** builds the Vite application from `frontend/` and serves its static output.
- **`backend`** exposes the FastAPI ASGI application at `app.main:app` from `backend/`.
- Requests to `/api/*` are routed to the Python service; all other paths are routed to the frontend service.

The browser uses the same-origin `/api` base URL, so this deployment does not need a separate API hostname or a CORS-origin change. The backend service root includes the checked-in sample CSV files under `backend/app/data/raw/`. The API reads this bundled, fixed dataset and does not write to the serverless filesystem, call Elexon at request time, or require a persistent volume. The one-off fetch script is not run during Vercel builds, and the sample is not automatically refreshed.

> **Platform note:** Vercel Services are currently in beta. The repository configuration has not been linked to a Vercel account or deployed from this environment; verify that Services are available to your account and inspect the deployment build logs.

The Vercel frontend service invokes Vite through Node directly instead of the generated `.bin/vite` shell launcher. Its npm manifest explicitly allows only esbuild's install script, which Vite needs for its platform-specific build binary.

### Deploy from the Vercel dashboard

1. Push the repository to GitHub and sign in to [Vercel](https://vercel.com/).
2. Select **Add New → Project** and import `AaliyaKhan25/ForeSure`.
3. Keep the project root at the repository root (`.`). Do not set it to `frontend/`; the root `vercel.json` needs to configure both services.
4. Review the detected service configuration and deploy. No Docker installation or environment variable is required for the fixed sample.
5. After the deployment succeeds, open the assigned Vercel URL and verify:
   - `/` loads the dashboard.
   - `/api/health` returns `{"status":"ok"}`.
   - `/api/dates` returns delivery dates.
   - `/api/forecast?date=2026-01-02` returns forecast points with real sample actuals where observations are available.

If GitHub is not linked, the Vercel CLI can deploy from the repository root. Install Node.js first, then run in PowerShell:

```powershell
npm install --global vercel
cd D:\ForeSure
vercel login
vercel
```

The first `vercel` deployment creates a preview deployment and links the local directory to a Vercel project. To publish a production deployment afterwards:

```powershell
vercel --prod
```

Vercel authentication and project ownership are controlled by your Vercel account; do not commit access tokens. The repository currently has no linked Vercel project. Anonymous CLI deployments are temporary and expire unless claimed; use an authenticated account deployment for a persistent project URL.

Vercel's Python Functions are serverless. This is appropriate for the fixed, read-only sample but is not configured as a continuously running API server. Function cold starts and runtime/resource limits should be measured before using it for production trading workflows.

## Configuration

| Variable | Default | Description |
|---|---|---|
| `DATA_DIR` | `backend/app/data` locally; `/data` in Compose | Root directory containing `raw/actuals.csv` and `raw/forecasts.csv` |
| `CUTOFF_TIME` | `09:00` | Decision time in UK local time on the day before delivery; format `HH:MM` |
| `ELEXON_BASE_URL` | `https://data.elexon.co.uk/bmrs/api/v1` | Elexon BMRS API base URL |
| `CORS_ORIGINS` | `*` | Comma-separated CORS origin list; the API currently allows GET requests |
| `FRONTEND_PORT` | `8080` | Host port mapped to frontend container port 80 in Compose |
| `VITE_API_URL` | `/api` | Frontend API base URL at Vite build time |
| `VITE_API_PROXY` | `http://localhost:8000` | Vite development-server proxy target |
| `VITE_USE_MOCK` | unset | Set to `true` at build time to force deterministic demo responses |

Compose reads `FRONTEND_PORT` and `CUTOFF_TIME` from the process environment or a `.env` file beside `docker-compose.yml`. Example:

```dotenv
FRONTEND_PORT=8080
CUTOFF_TIME=09:00
```

`FIRST_DECISION_DAY`, `LAST_DECISION_DAY`, `FORECAST_LOOKBACK_DAYS`, quantiles, and confidence thresholds are currently code-level assumptions in `backend/app/config.py`, not environment variables.

## Testing and validation

From the repository root:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q
```

Or, with the backend virtual environment activated:

```powershell
python -m pytest -q
```

The tests cover:

- Selecting the latest publication at or before the cutoff, including a publication exactly at the cutoff.
- Excluding forecasts published after the cutoff.
- Selecting forecasts independently for different delivery slots.
- Restricting served delivery dates to the assignment's January 2026 decision window.
- Calculating MAE, RMSE, and bias with the documented sign convention.
- Excluding missing actuals from error metrics.
- Loading CSV data, joining actuals to forecasts, and validating the requested delivery date.

Validate the frontend production bundle with:

```powershell
cd frontend
npm ci
npm run build
```

Validate Compose configuration and run the actual container build with Docker installed:

```powershell
docker compose config
docker compose build
```

## Operational notes and troubleshooting

### API reports `503` for missing files

Check that both files exist under `<DATA_DIR>/raw/`. For Compose, run the fetch command before starting the stack. For local development, the default path is `backend/app/data/raw/`.

### The frontend says it is using demo data

The API client falls back to deterministic generated demo data when a request fails, and displays a visible notice in the dashboard. Verify that the backend is running, the CSVs are present and valid, and the frontend's API URL or Vite proxy target is correct. The demo data is for UI preview and is not Elexon data.

### CSVs were updated but the API still returns old values

The API caches its loaded store in process. Restart the backend after replacing data files.

### A route works through Vite but not a direct static-server URL

The application uses hash routes, so application pages are addressed as `/#/briefing` and similar. The production NGINX configuration also includes an `index.html` fallback for normal paths.

### Inspect running containers

```powershell
docker compose ps
docker compose logs --tail 100 backend
docker compose logs --tail 100 frontend
```

## Known limitations and next steps

- **Fixed historical period:** the fetch script targets January 2026. There is no scheduler, streaming feed, or automatic refresh.
- **Historical replay, not live operations:** the dashboard compares historical forecasts selected at the decision cutoff with subsequently observed output.
- **In-sample evaluation:** the current error range, buffer, and headline performance metrics are derived from the same sample. A production evaluation should add time-based train/validation/test splits and out-of-sample backtesting.
- **Heuristic uncertainty:** hourly quantiles and the buffer are useful descriptive summaries, not calibrated conditional probabilities or guarantees.
- **Single generation series:** the current pipeline covers GB wind forecasts and reported wind generation; it does not combine demand, prices, contracts, portfolio positions, or other generation technologies.
- **Operational health:** `/api/health` is a process liveness response, not a data-readiness, freshness, or upstream-connectivity check.
- **Cache refresh:** data reload currently requires a backend restart.
- **No authentication or authorization:** the API is designed as a read-only prototype. A public deployment needs an explicit access-control, rate-limiting, logging, and data-governance design appropriate to its audience.
- **Production hardening:** add automated deployment and image scanning, pinned/reproducible dependency builds, secure secret and environment management, TLS, backups, and monitoring before relying on this service operationally.

## AI-assisted development

GitHub Copilot (Copilot SDK in VS Code) was used to assist with repository analysis, implementation and troubleshooting, deployment configuration, and technical documentation. The resulting changes were reviewed against the source code and validated with the available frontend build and backend tests; AI assistance does not replace independent review or operational validation.
