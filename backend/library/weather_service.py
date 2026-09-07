from datetime import datetime, timedelta, timezone
from uuid import uuid4

import httpx

from lib.db import db
from lib.thermal_index import calculate_thermal_index, severity_for_htsi
from models.weather import CurrentWeather, DailyForecast, ForecastPoint, ForecastResponse


OPEN_METEO_FORECAST = "https://api.open-meteo.com/v1/forecast"
WEATHER_TTL = timedelta(minutes=15)


def _weather_label(code: int) -> str:
    if code == 0:
        return "Clear sky"
    if code in {1, 2, 3}:
        return "Partly cloudy"
    if code in {45, 48}:
        return "Fog"
    if code in {51, 53, 55, 56, 57}:
        return "Drizzle"
    if code in {61, 63, 65, 66, 67}:
        return "Rain"
    if code in {71, 73, 75, 77}:
        return "Snow"
    if code in {80, 81, 82}:
        return "Rain showers"
    if code in {95, 96, 99}:
        return "Thunderstorm"
    return "Variable conditions"


def _value(values: list[float | int | None], index: int, default: float = 0) -> float:
    value = values[index] if index < len(values) else None
    return float(value if value is not None else default)


async def _fetch_forecast_payload(lat: float, lon: float, days: int = 7) -> dict:
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,surface_pressure,shortwave_radiation,uv_index,weather_code",
        "hourly": "temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation,uv_index,weather_code",
        "daily": "temperature_2m_max,temperature_2m_min",
        "forecast_days": max(1, min(days, 7)),
        "wind_speed_unit": "kmh",
        "timezone": "auto",
    }
    async with httpx.AsyncClient(timeout=15) as http:
        response = await http.get(OPEN_METEO_FORECAST, params=params)
        response.raise_for_status()
        return response.json()


async def get_current_weather(lat: float, lon: float, location_name: str | None = None, force_refresh: bool = False) -> CurrentWeather:
    key = f"current:{round(lat, 3)}:{round(lon, 3)}"
    now = datetime.now(timezone.utc)
    expires_at = cached_doc.get("expires_at") if cached_doc else None
    if expires_at is not None and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if cached_doc and not force_refresh and expires_at and expires_at > now:
        return CurrentWeather(**cached_doc["payload"], cached=True, stale=False)

    try:
        payload = await _fetch_forecast_payload(lat, lon, days=1)
        current = payload["current"]
        calc = calculate_thermal_index(
            float(current["temperature_2m"]),
            float(current["relative_humidity_2m"]),
            float(current["wind_speed_10m"]),
            float(current.get("shortwave_radiation") or 0),
        )
        result = CurrentWeather(
            location_name=location_name or f"{lat:.2f}, {lon:.2f}",
            latitude=lat,
            longitude=lon,
            timezone=payload.get("timezone", "UTC"),
            observed_at=current["time"],
            temperature_c=float(current["temperature_2m"]),
            relative_humidity=float(current["relative_humidity_2m"]),
            wind_speed_kmh=float(current["wind_speed_10m"]),
            uv_index=float(current.get("uv_index") or 0),
            pressure_hpa=float(current.get("surface_pressure") or 0),
            solar_radiation_wm2=float(current.get("shortwave_radiation") or 0),
            weather_code=int(current.get("weather_code") or 0),
            weather_label=_weather_label(int(current.get("weather_code") or 0)),
            feels_like_c=float(current.get("apparent_temperature") or current["temperature_2m"]),
            **calc,
            fetched_at=now,
        )
        await db.weather_cache.update_one(
            {"cache_key": key},
            {"$set": {"cache_key": key, "payload": result.model_dump(mode="json"), "expires_at": now + WEATHER_TTL}},
            upsert=True,
        )
        return result
    except (httpx.HTTPError, KeyError, TypeError, ValueError):
        if cached_doc and cached_doc.get("payload"):
            return CurrentWeather(**cached_doc["payload"], cached=True, stale=True)
        raise


async def get_forecast(lat: float, lon: float, location_name: str | None = None, days: int = 7) -> ForecastResponse:
    payload = await _fetch_forecast_payload(lat, lon, days=days)
    hourly_data = payload["hourly"]
    hourly: list[ForecastPoint] = []
    for index, time in enumerate(hourly_data["time"][:24]):
        calc = calculate_thermal_index(
            _value(hourly_data["temperature_2m"], index),
            _value(hourly_data["relative_humidity_2m"], index),
            _value(hourly_data["wind_speed_10m"], index),
            _value(hourly_data["shortwave_radiation"], index),
        )
        hourly.append(ForecastPoint(
            time=time,
            temperature_c=calc["temperature_c"],
            relative_humidity=calc["relative_humidity"],
            wind_speed_kmh=calc["wind_speed_kmh"],
            uv_index=_value(hourly_data["uv_index"], index),
            wbgt_c=calc["wbgt_c"],
            htsi=calc["htsi"],
            severity=calc["severity"],
        ))

    daily_data = payload["daily"]
    daily: list[DailyForecast] = []
    for index, date in enumerate(daily_data["time"][:days]):
        day_points = hourly[index * 24:(index + 1) * 24]
        peak = max((point.htsi for point in day_points), default=0)
        daily.append(DailyForecast(
            date=date,
            temperature_max_c=_value(daily_data["temperature_2m_max"], index),
            temperature_min_c=_value(daily_data["temperature_2m_min"], index),
            htsi_peak=round(peak, 1),
            severity=severity_for_htsi(peak),
        ))
    return ForecastResponse(
        location_name=location_name or f"{lat:.2f}, {lon:.2f}",
        latitude=lat,
        longitude=lon,
        timezone=payload.get("timezone", "UTC"),
        hourly=hourly,
        daily=daily,
        fetched_at=datetime.now(timezone.utc),
    )


def alert_from_weather(weather: CurrentWeather) -> dict:
    return {
        "id": str(uuid4()),
        "location_name": weather.location_name,
        "severity": weather.severity,
        "htsi": weather.htsi,
        "title": f"{weather.severity.upper()} thermal stress watch",
        "message": weather.advisory,
        "issued_at": weather.fetched_at,
        "action": "Review hydration, shade, and work-rest controls.",
    }
     cached_doc = await db.weather_cache.find_one({"cache_key": key})
    if cached_doc and not force_refresh and cached_doc.get("expires_at", now) > now:
        cached_payload = {**cached_doc["payload"], "cached": True, "stale": False}
        return CurrentWeather(**cached_payload)
        if cached_doc and cached_doc.get("payload"):
            stale_payload = {**cached_doc["payload"], "cached": True, "stale": True}
            return CurrentWeather(**stale_payload)
    all_hourly: list[ForecastPoint] = []
    for index, time in enumerate(hourly_data["time"]):
        all_hourly.append(ForecastPoint(
        day_points = all_hourly[index * 24:(index + 1) * 24]
    return ForecastResponse(
        hourly=all_hourly[:24],