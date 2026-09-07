fastapi import APIRouter, HTTPException, Query

from lib.weather_service import get_current_weather, get_forecast
from models.weather import CurrentWeather, ForecastResponse

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("/current", response_model=CurrentWeather)
async def current_weather(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    location_name: str | None = None,
    refresh: bool = False,
):
    try:
        return await get_current_weather(lat, lon, location_name, force_refresh=refresh)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Live weather provider unavailable: {exc}") from exc


@router.get("/forecast", response_model=ForecastResponse)
async def weather_forecast(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    days: int = Query(7, ge=1, le=7),
    location_name: str | None = None,
):
    try:
        return await get_forecast(lat, lon, location_name, days)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Forecast provider unavailable: {exc}") from exc