# AGNIDRISHTI Thermal Risk Index

## Product
Live thermal-risk intelligence for heat-health and municipal operations. The app has a public mission overview at `/` and a live Command Deck at `/dashboard`.

## Data model
- `locations`: external Open-Meteo geocoding results are represented as typed location objects in the frontend.
- `weather_cache`: MongoDB cache keyed by rounded coordinates with a 15-minute expiry and stale fallback payload.
- `cooling_triggers`: MongoDB audit records created when an operator queues a cooling-center response.
- Weather payloads include current conditions, derived NOAA heat index, WBGT screening estimate, UTCI approximation, and 0–100 HTSI severity.

## Integrations
- Open-Meteo Forecast API provides current observations and 7-day hourly/daily weather data. No API key is required for this deployment.
- Open-Meteo Geocoding API powers location search.
- Browser Geolocation API powers the “Detect me” action; permission remains with the user.

## Key flows
1. Landing page explains the system and links to the Command Deck.
2. Dashboard loads Jaipur by default, then fetches live current weather, 24-hour stress, 7-day forecast, and active alerts.
3. Users search for a city or detect device coordinates; all weather panels refresh for the selected location.
4. Users run a server-backed thermal scenario calculation with temperature, humidity, wind, and solar sliders.
5. Users generate a deterministic health advisory or queue a cooling-center operational trigger.

## Auth and roles
No authentication is implemented. The dashboard is publicly accessible demo/operations UI; cooling-center triggers are stored as operational records without a user identity.