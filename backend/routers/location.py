import httpx
from fastapi import APIRouter, HTTPException, Query

from models.weather import LocationResult

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("/search", response_model=list[LocationResult])
async def search_locations(q: str = Query(..., min_length=2, max_length=80)):
    try:
        async with httpx.AsyncClient(timeout=10) as http:
            response = await http.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params={"name": q, "count": 8, "language": "en", "format": "json"},
            )
            response.raise_for_status()
            results = response.json().get("results", [])
            return [LocationResult(
                id=str(item.get("id", f"{item['latitude']}:{item['longitude']}")),
                name=item["name"],
                latitude=item["latitude"],
                longitude=item["longitude"],
                country=item.get("country"),
                country_code=item.get("country_code"),
                admin1=item.get("admin1"),
                population=item.get("population"),
                timezone=item.get("timezone"),
            ) for item in results]
    except (httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=f"Location provider unavailable: {exc}") from exc