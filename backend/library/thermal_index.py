import math


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def heat_index_c(temperature_c: float, relative_humidity: float) -> float:
    """NOAA Rothfusz heat index approximation, returning Celsius."""
    temperature_f = temperature_c * 9 / 5 + 32
    rh = _clamp(relative_humidity, 0, 100)
    if temperature_f < 80 or rh < 40:
        return round(temperature_c, 2)
    hi_f = (
        -42.379
        + 2.04901523 * temperature_f
        + 10.14333127 * rh
        - 0.22475541 * temperature_f * rh
        - 0.00683783 * temperature_f**2
        - 0.05481717 * rh**2
        + 0.00122874 * temperature_f**2 * rh
        + 0.00085282 * temperature_f * rh**2
        - 0.00000199 * temperature_f**2 * rh**2
    )
    return round((hi_f - 32) * 5 / 9, 2)


def wet_bulb_c(temperature_c: float, relative_humidity: float) -> float:
    """Stull (2011) wet-bulb estimate, suitable for operational screening."""
    rh = _clamp(relative_humidity, 1, 100)
    temp = temperature_c
    return (
        temp * math.atan(0.151977 * math.sqrt(rh + 8.313659))
        + math.atan(temp + rh)
        - math.atan(rh - 1.676331)
        + 0.00391838 * rh**1.5 * math.atan(0.023101 * rh)
        - 4.686035
    )


def wbgt_c(
    temperature_c: float,
    relative_humidity: float,
    wind_speed_kmh: float,
    solar_radiation_wm2: float,
) -> float:
    """Outdoor WBGT screening estimate using a solar/wind-adjusted globe proxy."""
    tw = wet_bulb_c(temperature_c, relative_humidity)
    globe = temperature_c + 0.2 * math.sqrt(max(solar_radiation_wm2, 0)) - 0.08 * wind_speed_kmh
    return round(0.7 * tw + 0.2 * globe + 0.1 * temperature_c, 2)


def utci_c(temperature_c: float, relative_humidity: float, wind_speed_kmh: float) -> float:
    """A conservative apparent-temperature approximation for operational alerting."""
    vapor_pressure = (
        (relative_humidity / 100)
        * 6.105
        * math.exp(17.27 * temperature_c / (237.7 + temperature_c))
    )
    return round(temperature_c + 0.33 * vapor_pressure - 0.7 * wind_speed_kmh / 3.6 - 4, 2)


def severity_for_htsi(htsi: float) -> str:
    if htsi < 25:
        return "safe"
    if htsi < 46:
        return "caution"
    if htsi < 66:
        return "warning"
    if htsi < 86:
        return "danger"
    return "extreme"


def advisory_for_severity(severity: str) -> str:
    return {
        "safe": "Conditions are currently within a lower thermal-stress range.",
        "caution": "Plan shade and hydration breaks, especially during peak afternoon heat.",
        "warning": "Limit strenuous outdoor work and schedule frequent cooling breaks.",
        "danger": "Avoid prolonged outdoor exposure; activate heat-safety procedures now.",
        "extreme": "Treat this as a critical heat emergency and move people to cooling immediately.",
    }.get(severity, "Monitor conditions and follow local heat-safety guidance.")


def calculate_thermal_index(
    temperature_c: float,
    relative_humidity: float,
    wind_speed_kmh: float,
    solar_radiation_wm2: float,
    uhi_factor: float = 0,
    vulnerability_factor: float = 0.15,
) -> dict[str, float | str]:
    heat_index = heat_index_c(temperature_c, relative_humidity)
    wbgt = wbgt_c(temperature_c, relative_humidity, wind_speed_kmh, solar_radiation_wm2)
    utci = utci_c(temperature_c, relative_humidity, wind_speed_kmh)
    wbgt_score = _clamp((wbgt - 18) / 22 * 100, 0, 100)
    utci_score = _clamp((utci - 18) / 32 * 100, 0, 100)
    uhi_score = _clamp(uhi_factor / 6 * 100, 0, 100)
    vulnerability_score = _clamp(vulnerability_factor, 0, 1) * 100
    htsi = round(_clamp(0.4 * wbgt_score + 0.3 * utci_score + 0.15 * uhi_score + 0.15 * vulnerability_score, 0, 100), 1)
    severity = severity_for_htsi(htsi)
    return {
        "temperature_c": round(temperature_c, 2),
        "relative_humidity": round(relative_humidity, 1),
        "wind_speed_kmh": round(wind_speed_kmh, 1),
        "solar_radiation_wm2": round(solar_radiation_wm2, 1),
        "heat_index_c": heat_index,
        "wbgt_c": wbgt,
        "utci_c": utci,
        "htsi": htsi,
        "severity": severity,
        "advisory": advisory_for_severity(severity),
    }