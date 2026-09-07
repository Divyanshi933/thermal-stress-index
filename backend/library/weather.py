from datetime import datetime
from pydantic import BaseModel, Field


class LocationResult(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    country: str | None = None
    country_code: str | None = None
    admin1: str | None = None
    population: int | None = None
    timezone: str | None = None


class ThermalBreakdown(BaseModel):
    temperature_c: float
    relative_humidity: float
    wind_speed_kmh: float
    solar_radiation_wm2: float
    heat_index_c: float
    wbgt_c: float
    utci_c: float
    htsi: float = Field(ge=0, le=100)
    severity: str
    advisory: str


class CurrentWeather(BaseModel):
    location_name: str
    latitude: float
    longitude: float
    timezone: str
    observed_at: str
    temperature_c: float
    relative_humidity: float
    wind_speed_kmh: float
    uv_index: float
    pressure_hpa: float
    solar_radiation_wm2: float
    weather_code: int
    weather_label: str
    feels_like_c: float
    heat_index_c: float
    wbgt_c: float
    utci_c: float
    htsi: float = Field(ge=0, le=100)
    severity: str
    advisory: str
    data_source: str = "Open-Meteo"
    cached: bool = False
    stale: bool = False
    fetched_at: datetime


class ForecastPoint(BaseModel):
    time: str
    temperature_c: float
    relative_humidity: float
    wind_speed_kmh: float
    uv_index: float
    wbgt_c: float
    htsi: float = Field(ge=0, le=100)
    severity: str


class DailyForecast(BaseModel):
    date: str
    temperature_max_c: float
    temperature_min_c: float
    htsi_peak: float = Field(ge=0, le=100)
    severity: str


class ForecastResponse(BaseModel):
    location_name: str
    latitude: float
    longitude: float
    timezone: str
    hourly: list[ForecastPoint]
    daily: list[DailyForecast]
    data_source: str = "Open-Meteo"
    fetched_at: datetime


class ThermalCalculationRequest(BaseModel):
    temperature_c: float = Field(ge=-60, le=70)
    relative_humidity: float = Field(ge=0, le=100)
    wind_speed_kmh: float = Field(ge=0, le=200)
    solar_radiation_wm2: float = Field(default=0, ge=0, le=1500)
    uhi_factor: float = Field(default=0, ge=0, le=10)
    vulnerability_factor: float = Field(default=0.15, ge=0, le=1)


class ThermalCalculationResponse(ThermalBreakdown):
    uhi_factor: float
    vulnerability_factor: float


class Alert(BaseModel):
    id: str
    location_name: str
    severity: str
    htsi: float = Field(ge=0, le=100)
    title: str
    message: str
    issued_at: datetime
    action: str


class AdvisoryRequest(BaseModel):
    location_name: str
    htsi: float = Field(ge=0, le=100)
    severity: str
    temperature_c: float
    relative_humidity: float
    audience: str = "general public"


class AdvisoryResponse(BaseModel):
    location_name: str
    severity: str
    headline: str
    message: str
    actions: list[str]
    generated_at: datetime