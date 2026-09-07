from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Query

from lib.thermal_index import advisory_for_severity
from lib.weather_service import alert_from_weather, get_current_weather
from models.weather import AdvisoryRequest, AdvisoryResponse, Alert
from models.weather import CoolingCenterTriggerRequest, CoolingCenterTriggerResponse
from lib.db import db

router = APIRouter(tags=["operations"])


@router.get("/alerts/active", response_model=list[Alert])
async def active_alerts(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    location_name: str | None = None,
):
    weather = await get_current_weather(lat, lon, location_name)
    if weather.htsi < 25:
        return []
    return [Alert(**alert_from_weather(weather))]


@router.post("/advisories/generate", response_model=AdvisoryResponse)
async def generate_advisory(request: AdvisoryRequest):
    intensity = "critical" if request.htsi >= 86 else "elevated" if request.htsi >= 46 else "monitor"
    actions = [
        "Drink water regularly and avoid waiting until you feel thirsty.",
        "Move strenuous activity to cooler hours and take shade breaks.",
        "Check on older adults, children, outdoor workers, and people with chronic illness.",
    ]
    if request.htsi >= 66:
        actions.append("Activate local cooling spaces and heat-health communication protocols.")
    return AdvisoryResponse(
        location_name=request.location_name,
        severity=request.severity,
        headline=f"{request.severity.upper()} heat protocol for {request.location_name}",
        message=(
            f"Thermal stress is {intensity} at {request.htsi:.0f}/100 with "
            f"{request.temperature_c:.1f}°C and {request.relative_humidity:.0f}% humidity. "
            f"{advisory_for_severity(request.severity)}"
        ),
        actions=actions,
        generated_at=datetime.now(timezone.utc),
    )


@router.post("/operations/cooling-center-trigger", response_model=CoolingCenterTriggerResponse)
async def trigger_cooling_center(request: CoolingCenterTriggerRequest):
    created_at = datetime.now(timezone.utc)
    trigger_id = str(uuid4())
    await db.cooling_triggers.insert_one({
        "trigger_id": trigger_id,
        **request.model_dump(),
        "created_at": created_at,
    })
    return CoolingCenterTriggerResponse(
        trigger_id=trigger_id,
        location_name=request.location_name,
        status="queued",
        message="Cooling-center response trigger queued for local operations review.",
        created_at=created_at,
    )    