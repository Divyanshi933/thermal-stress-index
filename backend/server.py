from fastapi import FastAPI, APIRouter
from routers.locations import router as locations_router
from routers.operations import router as operations_router
from routers.thermal import router as thermal_router
from routers.weather import router as weather_router
@api_router.get("/")
async def root():
    return {"message": "Thermal Risk Index API", "status": "operational", "data_source": "Open-Meteo"}


api_router.include_router(weather_router)
api_router.include_router(locations_router)
api_router.include_router(operations_router)
api_router.include_router(thermal_router)
logger = logging.getLogger(__name__)

# Include the router in the main app last so every route remains under /api.
app.include_router(api_router)