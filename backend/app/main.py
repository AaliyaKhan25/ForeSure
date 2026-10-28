from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.api import routes_briefing, routes_forecast, routes_metrics

app = FastAPI(title="ForeSure API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


app.include_router(routes_forecast.router, prefix="/api")
app.include_router(routes_briefing.router, prefix="/api")
app.include_router(routes_metrics.router, prefix="/api")