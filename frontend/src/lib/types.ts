export interface LocationResult {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country: string | null;
  country_code: string | null;
  admin1: string | null;
  population: number | null;
  timezone: string | null;
}

export interface CurrentWeather {
  location_name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  observed_at: string;
  temperature_c: number;
  relative_humidity: number;
  wind_speed_kmh: number;
  uv_index: number;
  pressure_hpa: number;
  solar_radiation_wm2: number;
  weather_code: number;
  weather_label: string;
  feels_like_c: number;
  heat_index_c: number;
  wbgt_c: number;
  utci_c: number;
  htsi: number;
  severity: string;
  advisory: string;
  data_source: string;
  cached: boolean;
  stale: boolean;
  fetched_at: string;
}

export interface ForecastPoint {
  time: string;
  temperature_c: number;
  relative_humidity: number;
  wind_speed_kmh: number;
  uv_index: number;
  wbgt_c: number;
  htsi: number;
  severity: string;
}

export interface DailyForecast {
  date: string;
  temperature_max_c: number;
  temperature_min_c: number;
  htsi_peak: number;
  severity: string;
}

export interface ForecastResponse {
  location_name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: ForecastPoint[];
  daily: DailyForecast[];
  data_source: string;
  fetched_at: string;
}

export interface ThermalCalculationRequest {
  temperature_c: number;
  relative_humidity: number;
  wind_speed_kmh: number;
  solar_radiation_wm2: number;
  uhi_factor: number;
  vulnerability_factor: number;
}

export interface ThermalCalculationResponse {
  temperature_c: number;
  relative_humidity: number;
  wind_speed_kmh: number;
  solar_radiation_wm2: number;
  heat_index_c: number;
  wbgt_c: number;
  utci_c: number;
  htsi: number;
  severity: string;
  advisory: string;
  uhi_factor: number;
  vulnerability_factor: number;
}

export interface Alert {
  id: string;
  location_name: string;
  severity: string;
  htsi: number;
  title: string;
  message: string;
  issued_at: string;
  action: string;
}

export interface AdvisoryResponse {
  location_name: string;
  severity: string;
  headline: string;
  message: string;
  actions: string[];
  generated_at: string;
}

export interface CoolingCenterTriggerResponse {
  trigger_id: string;
  location_name: string;
  status: string;
  message: string;
  created_at: string;
}