import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity, AlertTriangle, ArrowLeft, Clock3, CloudSun, Crosshair, Droplets,
  Gauge, LocateFixed, MapPin, Radio, RefreshCw, Send, Sun, Thermometer, Wind, Zap,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { apiGet, apiPost } from "@/lib/api";
import type {
  AdvisoryResponse, Alert, CoolingCenterTriggerResponse, CurrentWeather, ForecastResponse,
  LocationResult, ThermalCalculationRequest, ThermalCalculationResponse,
} from "@/lib/types";

const DEFAULT_LOCATION: LocationResult = {
  id: "jaipur-default", name: "Jaipur", latitude: 26.9124, longitude: 75.7873,
  country: "India", country_code: "IN", admin1: "Rajasthan", population: null, timezone: "Asia/Kolkata",
};

const severityColor: Record<string, string> = {
  safe: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
  caution: "text-amber-300 border-amber-400/30 bg-amber-400/10",
  warning: "text-orange-300 border-orange-400/30 bg-orange-400/10",
  danger: "text-red-300 border-red-400/30 bg-red-400/10",
  extreme: "text-pink-300 border-pink-400/30 bg-pink-400/10",
};

function severityText(severity: string) {
  return severity ? severity.charAt(0).toUpperCase() + severity.slice(1) : "Unknown";
}

function hourLabel(value: string) {
  return value.slice(11, 16);
}

function dayLabel(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" });
}

function MetricCard({ testId, label, value, unit, icon: Icon, accent = "text-cyan-300" }: { testId: string; label: string; value: string; unit: string; icon: typeof Thermometer; accent?: string }) {
  return (
    <Card className="group border-slate-800 bg-[#121824] shadow-none transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-cyan-300/30" data-testid={testId}>
      <CardContent className="p-5">
        <div className="mb-7 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</span><Icon size={16} className={accent} /></div>
        <div className="font-mono text-3xl font-bold tracking-tight text-slate-100" data-testid={`${testId}-value`}>{value}<span className="ml-1 text-sm font-normal text-slate-500">{unit}</span></div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [location, setLocation] = useState<LocationResult>(DEFAULT_LOCATION);
  const [search, setSearch] = useState("");
  const [forecastTab, setForecastTab] = useState<"24h" | "7day">("24h");
  const [calculator, setCalculator] = useState<ThermalCalculationRequest>({ temperature_c: 38, relative_humidity: 55, wind_speed_kmh: 10, solar_radiation_wm2: 600, uhi_factor: 2, vulnerability_factor: 0.15 });

  const weatherQuery = useQuery({
    queryKey: ["weather-current", location.latitude, location.longitude, location.name],
    queryFn: () => apiGet<CurrentWeather>(`/weather/current?lat=${location.latitude}&lon=${location.longitude}&location_name=${encodeURIComponent(location.name)}`),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const forecastQuery = useQuery({
    queryKey: ["weather-forecast", location.latitude, location.longitude, location.name],
    queryFn: () => apiGet<ForecastResponse>(`/weather/forecast?lat=${location.latitude}&lon=${location.longitude}&days=7&location_name=${encodeURIComponent(location.name)}`),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
  const searchQuery = useQuery({
    queryKey: ["location-search", search],
    queryFn: () => apiGet<LocationResult[]>(`/locations/search?q=${encodeURIComponent(search.trim())}`),
    enabled: search.trim().length >= 2,
    retry: false,
  });
  const alertQuery = useQuery({
    queryKey: ["alerts", location.latitude, location.longitude, location.name],
    queryFn: () => apiGet<Alert[]>(`/alerts/active?lat=${location.latitude}&lon=${location.longitude}&location_name=${encodeURIComponent(location.name)}`),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
  const thermalMutation = useMutation({
    mutationFn: (input: ThermalCalculationRequest) => apiPost<ThermalCalculationResponse>("/thermal/calculate", input),
    onSuccess: (result) => toast.success(`Simulator updated: HTSI ${result.htsi.toFixed(1)}`),
    onError: () => toast.error("Simulator could not reach the risk engine."),
  });
  const advisoryMutation = useMutation({
    mutationFn: (weather: CurrentWeather) => apiPost<AdvisoryResponse>("/advisories/generate", {
      location_name: weather.location_name, htsi: weather.htsi, severity: weather.severity,
      temperature_c: weather.temperature_c, relative_humidity: weather.relative_humidity, audience: "general public",
    }),
    onSuccess: (result) => toast.success(result.headline),
    onError: () => toast.error("Advisory service is temporarily unavailable."),
  });
  const coolingMutation = useMutation({
    mutationFn: (weather: CurrentWeather) => apiPost<CoolingCenterTriggerResponse>("/operations/cooling-center-trigger", {
      location_name: weather.location_name, severity: weather.severity, htsi: weather.htsi, requester: "command deck",
    }),
    onSuccess: (result) => toast.success(`${result.status}: ${result.message}`),
    onError: () => toast.error("Cooling-center trigger could not be queued."),
  });

  const weather = weatherQuery.data;
  const forecast = forecastQuery.data;
  const risk = weather?.htsi ?? 0;
  const circleOffset = 408 - (408 * risk) / 100;

  const handleLocate = () => {
    if (!navigator.geolocation) {
      toast.error("Location detection is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => setLocation({ ...DEFAULT_LOCATION, id: "device-location", name: "Current position", latitude: position.coords.latitude, longitude: position.coords.longitude, country: null, country_code: null, admin1: null, timezone: null }),
      () => toast.error("Location permission was unavailable. Search for a city instead."),
    );
  };

  const handleCalculate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    thermalMutation.mutate(calculator);
  };

  const updateCalculator = (key: keyof ThermalCalculationRequest, value: string) => {
    setCalculator((previous) => ({ ...previous, [key]: Number(value) }));
  };

  return (
    <main className="min-h-svh bg-[#0a0d12] text-slate-100" data-testid="dashboard-page">
      <Toaster theme="dark" position="bottom-right" />
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#0a0d12]/90 backdrop-blur-xl" data-testid="dashboard-header">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-4 px-5 py-4 sm:px-8 lg:px-12">
          <Link to="/" className="flex items-center gap-3" data-testid="dashboard-brand-link"><span className="flex size-8 items-center justify-center border border-cyan-300/50 bg-cyan-300/10 text-cyan-300"><Radio size={15} /></span><span className="font-heading text-sm font-bold uppercase tracking-wider">Thermal Risk Index</span></Link>
          <div className="hidden h-6 w-px bg-slate-800 sm:block" />
          <div className="relative min-w-[240px] flex-1 sm:max-w-md"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search city, district or ward" className="h-10 border-slate-700 bg-slate-900/80 pl-9 font-mono text-xs placeholder:text-slate-600" data-testid="location-search-input" />{searchQuery.data && search.trim().length >= 2 && <div className="absolute inset-x-0 top-12 z-40 border border-slate-700 bg-[#121824] p-1 shadow-2xl" data-testid="location-search-results">{searchQuery.data.length ? searchQuery.data.map((result) => <button type="button" key={result.id} onClick={() => { setLocation(result); setSearch(""); }} className="flex w-full items-start gap-3 px-3 py-3 text-left text-xs transition-colors duration-200 hover:bg-cyan-300/10" data-testid={`location-result-${result.id}`}><MapPin size={14} className="mt-0.5 text-cyan-300" /><span><span className="block font-semibold text-slate-200">{result.name}</span><span className="text-slate-500">{[result.admin1, result.country].filter(Boolean).join(", ")}</span></span></button>) : <div className="px-3 py-4 font-mono text-xs text-slate-500" data-testid="location-search-empty">No locations found</div>}</div>}</div>
          <Button variant="outline" size="sm" onClick={handleLocate} className="border-slate-700 bg-transparent font-mono text-[10px] uppercase tracking-widest" data-testid="location-geolocate-button"><LocateFixed size={14} /> <span className="hidden sm:inline">Detect me</span></Button>
          <Button variant="outline" size="icon-sm" onClick={() => { void weatherQuery.refetch(); void forecastQuery.refetch(); }} className="border-slate-700 bg-transparent" aria-label="Refresh weather" data-testid="weather-refresh-button"><RefreshCw size={15} className={weatherQuery.isFetching ? "animate-spin" : ""} /></Button>
          <Badge variant="outline" className="hidden border-emerald-400/30 bg-emerald-400/10 font-mono text-[10px] uppercase tracking-widest text-emerald-300 lg:inline-flex" data-testid="dashboard-live-status"><span className="mr-2 size-1.5 animate-pulse bg-emerald-400" /> live / open-meteo</Badge>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
        <section className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end" data-testid="dashboard-overview-section"><div><Link to="/" className="mb-5 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 transition-colors duration-200 hover:text-cyan-300" data-testid="dashboard-back-link"><ArrowLeft size={13} /> mission overview</Link><p className="font-mono text-xs uppercase tracking-[0.25em] text-cyan-300">Command deck / real-time telemetry</p><h1 className="mt-2 font-heading text-4xl font-black uppercase tracking-tight sm:text-6xl" data-testid="dashboard-title">{location.name}</h1><p className="mt-2 flex items-center gap-2 font-mono text-xs text-slate-500" data-testid="dashboard-coordinates"><Crosshair size={13} className="text-cyan-300" /> {location.latitude.toFixed(4)}° / {location.longitude.toFixed(4)}° {weather ? `· ${weather.timezone}` : ""}</p></div><div className="flex items-center gap-3" data-testid="dashboard-data-status"><Clock3 size={14} className="text-slate-500" /><span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{weather?.stale ? "stale cache / provider retrying" : weather?.cached ? "cached / refreshed 15m" : "streaming observation"}</span></div></section>

        {weatherQuery.isError && <div className="mb-6 flex items-center gap-3 border border-amber-400/30 bg-amber-400/5 p-4 text-sm text-amber-200" data-testid="weather-error-banner"><AlertTriangle size={18} /> Live weather is temporarily unavailable. The dashboard shell remains available; retry or choose another location.</div>}
        {alertQuery.data?.[0] && <div className={`mb-6 flex flex-col gap-3 border p-4 sm:flex-row sm:items-center sm:justify-between ${severityColor[alertQuery.data[0].severity] ?? severityColor.warning}`} data-testid="emergency-advisory-banner"><div className="flex items-start gap-3"><AlertTriangle size={18} className="mt-0.5 shrink-0" /><div><span className="block font-mono text-[10px] uppercase tracking-widest">{alertQuery.data[0].title}</span><span className="mt-1 block text-sm text-slate-200">{alertQuery.data[0].message}</span></div></div><Button size="sm" variant="outline" onClick={() => weather && advisoryMutation.mutate(weather)} className="border-current bg-transparent font-mono text-[10px] uppercase tracking-widest" data-testid="generate-advisory-button"><Zap size={13} /> Generate advisory</Button></div>}

        <section className="grid gap-5 lg:grid-cols-12" data-testid="live-telemetry-grid">
          <Card className="relative overflow-hidden border-slate-800 bg-[#121824] shadow-none lg:col-span-4" data-testid="htsi-index-gauge"><div className="absolute right-0 top-0 size-44 rounded-full bg-cyan-300/5 blur-3xl" /><CardHeader className="relative flex-row items-center justify-between"><CardTitle className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Human thermal stress</CardTitle><Gauge size={17} className="text-cyan-300" /></CardHeader><CardContent className="relative flex flex-col items-center pb-8 pt-2"><div className="relative size-56"><svg viewBox="0 0 160 160" className="size-full -rotate-90"><circle cx="80" cy="80" r="65" fill="none" stroke="#1e293b" strokeWidth="11" /><circle cx="80" cy="80" r="65" fill="none" stroke={risk >= 66 ? "#ef4444" : risk >= 46 ? "#f97316" : "#10b981"} strokeWidth="11" strokeLinecap="square" strokeDasharray="408" strokeDashoffset={circleOffset} className="transition-[stroke-dashoffset] duration-700" /></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="font-mono text-6xl font-bold tracking-[-0.08em]" data-testid="htsi-index-value">{weather ? weather.htsi.toFixed(1) : "--"}</span><span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">/ 100 index</span></div></div><Badge variant="outline" className={`mt-2 font-mono text-[10px] uppercase tracking-[0.16em] ${weather ? severityColor[weather.severity] : "border-slate-700 text-slate-500"}`} data-testid="htsi-severity-badge">{weather ? severityText(weather.severity) : "Awaiting signal"}</Badge><p className="mt-5 text-center text-sm leading-relaxed text-slate-400" data-testid="htsi-advisory-text">{weather?.advisory ?? "Connect to live telemetry to calculate the human impact of current weather."}</p></CardContent></Card>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-4"><MetricCard testId="metric-temperature-card" label="Temperature" value={weather ? weather.temperature_c.toFixed(1) : "--"} unit="°C" icon={Thermometer} accent="text-orange-300" /><MetricCard testId="metric-humidity-card" label="Humidity" value={weather ? weather.relative_humidity.toFixed(0) : "--"} unit="% RH" icon={Droplets} accent="text-cyan-300" /><MetricCard testId="metric-wind-card" label="Wind speed" value={weather ? weather.wind_speed_kmh.toFixed(0) : "--"} unit="km/h" icon={Wind} accent="text-emerald-300" /><MetricCard testId="metric-wbgt-card" label="WBGT" value={weather ? weather.wbgt_c.toFixed(1) : "--"} unit="°C" icon={Sun} accent="text-amber-300" /><Card className="border-slate-800 bg-[#121824] shadow-none sm:col-span-2 lg:col-span-4" data-testid="current-observation-card"><CardContent className="grid gap-5 p-5 sm:grid-cols-4"><div><span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Conditions</span><p className="mt-2 flex items-center gap-2 font-heading text-xl font-bold uppercase" data-testid="current-weather-label"><CloudSun size={18} className="text-cyan-300" /> {weather?.weather_label ?? "Loading"}</p></div><div><span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Feels like</span><p className="mt-2 font-mono text-xl font-bold" data-testid="current-feels-like">{weather ? `${weather.feels_like_c.toFixed(1)}°C` : "--"}</p></div><div><span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">UV index</span><p className="mt-2 font-mono text-xl font-bold" data-testid="current-uv-index">{weather?.uv_index.toFixed(1) ?? "--"}</p></div><div><span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Observed</span><p className="mt-2 font-mono text-sm font-bold text-slate-300" data-testid="current-observed-time">{weather?.observed_at?.replace("T", " ") ?? "--"}</p></div></CardContent></Card></div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-12" data-testid="forecast-and-tools-section">
          <Card className="border-slate-800 bg-[#121824] shadow-none lg:col-span-8" data-testid="forecast-panel"><CardHeader className="flex-row items-center justify-between border-b border-slate-800"><div><CardTitle className="font-heading text-2xl font-bold uppercase" data-testid="forecast-panel-title">Thermal forecast</CardTitle><p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-slate-500">Stress envelope / provider horizon</p></div><div className="flex border border-slate-700 p-1"><button type="button" onClick={() => setForecastTab("24h")} className={`px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors duration-200 ${forecastTab === "24h" ? "bg-cyan-300 text-[#0a0d12]" : "text-slate-500 hover:text-slate-200"}`} data-testid="forecast-tab-24h">24 hour</button><button type="button" onClick={() => setForecastTab("7day")} className={`px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors duration-200 ${forecastTab === "7day" ? "bg-cyan-300 text-[#0a0d12]" : "text-slate-500 hover:text-slate-200"}`} data-testid="forecast-tab-7day">7 day</button></div></CardHeader><CardContent className="p-5">{forecastTab === "24h" ? <div className="h-[310px]" data-testid="forecast-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={forecast?.hourly ?? []} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}><defs><linearGradient id="htsiFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00f0ff" stopOpacity={0.28} /><stop offset="95%" stopColor="#00f0ff" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="time" tickFormatter={hourLabel} tick={{ fill: "#64748b", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} interval={3} /><YAxis yAxisId="temp" tick={{ fill: "#64748b", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} /><YAxis yAxisId="risk" orientation="right" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "#121824", border: "1px solid #334155", color: "#e2e8f0", fontFamily: "JetBrains Mono", fontSize: 11 }} /><ReferenceLine yAxisId="risk" y={66} stroke="#ef4444" strokeDasharray="5 5" /><Area yAxisId="risk" type="monotone" dataKey="htsi" stroke="#00f0ff" fill="url(#htsiFill)" strokeWidth={2} name="HTSI" /><Area yAxisId="temp" type="monotone" dataKey="temperature_c" stroke="#f97316" fill="none" strokeWidth={2} name="Temp °C" /></AreaChart></ResponsiveContainer></div> : <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7" data-testid="forecast-seven-day-grid">{forecast?.daily.map((day) => <div key={day.date} className="border border-slate-800 bg-slate-900/40 p-4"><span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{dayLabel(day.date)}</span><p className="mt-5 font-mono text-xl font-bold">{day.temperature_max_c.toFixed(0)}°</p><p className="font-mono text-xs text-slate-500">low {day.temperature_min_c.toFixed(0)}°</p><div className={`mt-6 border-t pt-3 font-mono text-[10px] uppercase tracking-widest ${severityColor[day.severity]?.split(" ")[0] ?? "text-slate-400"}`}>{day.htsi_peak.toFixed(0)} HTSI</div></div>)}</div>}{forecastQuery.isError && <p className="mt-4 font-mono text-xs text-amber-300" data-testid="forecast-error">Forecast data could not be loaded. Retry from the top bar.</p>}</CardContent></Card>

          <Card className="border-slate-800 bg-[#121824] shadow-none lg:col-span-4" data-testid="thermal-simulator-panel"><CardHeader><CardTitle className="flex items-center gap-2 font-heading text-2xl font-bold uppercase"><Activity size={19} className="text-cyan-300" /> Simulator</CardTitle><p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Stress-test a scenario</p></CardHeader><CardContent><form onSubmit={handleCalculate} className="space-y-5"><label className="block" data-testid="thermal-slider-temperature-label"><span className="mb-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-slate-500"><span>Dry temperature</span><span className="text-orange-300">{calculator.temperature_c}°C</span></span><input type="range" min="20" max="55" value={calculator.temperature_c} onChange={(event) => updateCalculator("temperature_c", event.target.value)} className="w-full accent-orange-400" data-testid="thermal-slider-temperature" /></label><label className="block" data-testid="thermal-slider-humidity-label"><span className="mb-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-slate-500"><span>Relative humidity</span><span className="text-cyan-300">{calculator.relative_humidity}%</span></span><input type="range" min="10" max="100" value={calculator.relative_humidity} onChange={(event) => updateCalculator("relative_humidity", event.target.value)} className="w-full accent-cyan-300" data-testid="thermal-slider-humidity" /></label><label className="block"><span className="mb-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-slate-500"><span>Wind speed</span><span className="text-emerald-300">{calculator.wind_speed_kmh} km/h</span></span><input type="range" min="0" max="60" value={calculator.wind_speed_kmh} onChange={(event) => updateCalculator("wind_speed_kmh", event.target.value)} className="w-full accent-emerald-300" data-testid="thermal-slider-wind" /></label><label className="block"><span className="mb-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-slate-500"><span>Solar load</span><span className="text-amber-300">{calculator.solar_radiation_wm2} W/m²</span></span><input type="range" min="0" max="1200" step="50" value={calculator.solar_radiation_wm2} onChange={(event) => updateCalculator("solar_radiation_wm2", event.target.value)} className="w-full accent-amber-300" data-testid="thermal-slider-solar" /></label><Button type="submit" className="w-full font-mono text-[10px] uppercase tracking-[0.18em]" disabled={thermalMutation.isPending} data-testid="thermal-calculator-button">{thermalMutation.isPending ? "Calculating…" : "Calculate scenario"}<Zap size={14} /></Button>{thermalMutation.data && <div className={`border p-4 ${severityColor[thermalMutation.data.severity]}`} data-testid="thermal-calculator-result"><div className="flex items-end justify-between"><span className="font-mono text-[10px] uppercase tracking-widest">Scenario HTSI</span><span className="font-mono text-3xl font-bold">{thermalMutation.data.htsi.toFixed(1)}</span></div><p className="mt-2 text-xs text-slate-300">WBGT {thermalMutation.data.wbgt_c.toFixed(1)}°C · {severityText(thermalMutation.data.severity)}</p></div>}</form></CardContent></Card>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-12" data-testid="response-operations-section">
          <Card className="border-slate-800 bg-[#121824] shadow-none lg:col-span-7" data-testid="response-panel"><CardHeader><CardTitle className="flex items-center gap-2 font-heading text-2xl font-bold uppercase"><AlertTriangle size={19} className="text-orange-300" /> Response protocol</CardTitle><p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Translate signal into a field action</p></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-3"><div className="border border-slate-800 p-4" data-testid="response-step-sense"><Radio size={17} className="text-cyan-300" /><p className="mt-8 font-heading text-lg font-bold uppercase">Sense</p><p className="mt-1 text-xs text-slate-500">Live observation</p></div><div className="border border-slate-800 p-4" data-testid="response-step-compute"><Gauge size={17} className="text-orange-300" /><p className="mt-8 font-heading text-lg font-bold uppercase">Compute</p><p className="mt-1 text-xs text-slate-500">Human stress index</p></div><div className="border border-slate-800 p-4" data-testid="response-step-dispatch"><Send size={17} className="text-rose-300" /><p className="mt-8 font-heading text-lg font-bold uppercase">Dispatch</p><p className="mt-1 text-xs text-slate-500">Cooling action</p></div></div><div className="mt-4 flex flex-col gap-3 border border-slate-800 bg-slate-900/40 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Public health advisory</p><p className="mt-1 text-sm text-slate-300" data-testid="response-advisory-copy">{weather?.advisory ?? "Awaiting live risk signal."}</p></div><Button variant="outline" size="sm" onClick={() => weather && advisoryMutation.mutate(weather)} disabled={!weather || advisoryMutation.isPending} className="shrink-0 border-slate-700 bg-transparent font-mono text-[10px] uppercase tracking-widest" data-testid="response-generate-advisory-button">Generate <Zap size={13} /></Button></div></CardContent></Card>
          <Card className="border-slate-800 bg-[#121824] shadow-none lg:col-span-5" data-testid="cooling-center-panel"><CardHeader><CardTitle className="flex items-center gap-2 font-heading text-2xl font-bold uppercase"><Users size={19} className="text-rose-300" /> Cooling centers</CardTitle><p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Municipal operations trigger</p></CardHeader><CardContent><div className="border border-rose-400/20 bg-rose-400/5 p-5"><div className="flex items-start gap-3"><div className="mt-1 size-2 animate-pulse bg-rose-400" /><div><p className="font-mono text-[10px] uppercase tracking-widest text-rose-300">{weather ? `${severityText(weather.severity)} protocol` : "No active protocol"}</p><p className="mt-2 text-sm leading-relaxed text-slate-300" data-testid="cooling-center-status">Queue a cooling-center response when risk is elevated, then review with local operations.</p></div></div><Button onClick={() => weather && coolingMutation.mutate(weather)} disabled={!weather || coolingMutation.isPending} className="mt-5 w-full bg-rose-500 text-white hover:bg-rose-400" data-testid="cooling-center-trigger-button">{coolingMutation.isPending ? "Queueing…" : "Queue cooling-center trigger"}<Send size={14} /></Button></div></CardContent></Card>
        </section>
        <footer className="mt-10 flex flex-col gap-3 border-t border-slate-800 pt-5 font-mono text-[10px] uppercase tracking-widest text-slate-600 sm:flex-row sm:items-center sm:justify-between" data-testid="dashboard-footer"><span>Source: Open-Meteo global weather + geocoding</span><span className="flex items-center gap-2"><Activity size={12} /> {weatherQuery.isFetching ? "syncing" : "system ready"}</span></footer>
      </div>
    </main>
  );
}