from fastapi import APIRouter

from lib.thermal_index import calculate_thermal_index
from models.weather import ThermalCalculationRequest, ThermalCalculationResponse

router = APIRouter(prefix="/thermal", tags=["thermal"])


@router.post("/calculate", response_model=ThermalCalculationResponse)
async def calculate_thermal(request: ThermalCalculationRequest):
    return ThermalCalculationResponse(
        **calculate_thermal_index(
            temperature_c=request.temperature_c,
            relative_humidity=request.relative_humidity,
            wind_speed_kmh=request.wind_speed_kmh,
            solar_radiation_wm2=request.solar_radiation_wm2,
            uhi_factor=request.uhi_factor,
            vulnerability_factor=request.vulnerability_factor,
        ),
        uhi_factor=request.uhi_factor,
        vulnerability_factor=request.vulnerability_factor,
    )