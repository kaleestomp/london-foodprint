import os
import ssl
from contextlib import asynccontextmanager

import asyncpg
from dotenv import find_dotenv, load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from api.nearby_api.nearby_api import router as nearby_router
from api.place_api import router as place_router
from api.places_list_api import router as places_list_router
from api.tile_api.tile_api import router as tiles_router
from api.top_places_in_view_api.top_places_in_view_api import router as top_places_in_view_router
from api.ip_location.ip_location import router as ip_location_router
from api.geocode.geocode_api import router as geocode_router
from api.histogram_api.cuisine_histogram_api import router as cuisine_histogram_router
from api.histogram_api.price_histogram_api import router as price_histogram_router
from api.cache_debug_api import router as cache_debug_router

load_dotenv()

# Load local overrides if present (gitignored in this repo).
_env_local_path = find_dotenv(".env.local", usecwd=True)
if _env_local_path:
    load_dotenv(_env_local_path, override=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required")

    # Neon requires SSL. On Windows, asyncpg needs an explicit SSLContext
    # rather than ssl='require' to complete the TLS handshake correctly.
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE

    app.state.pool = await asyncpg.create_pool(
        dsn=database_url,
        min_size=int(os.getenv("DB_POOL_MIN_SIZE", "1")),
        max_size=int(os.getenv("DB_POOL_MAX_SIZE", "5")),
        command_timeout=30,
        ssl=ssl_ctx,
    )
    yield
    await app.state.pool.close()


app = FastAPI(title="London Explorer API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tiles_router)
app.include_router(top_places_in_view_router)
app.include_router(nearby_router)
app.include_router(place_router)
app.include_router(places_list_router)
app.include_router(ip_location_router)
app.include_router(geocode_router)
app.include_router(cuisine_histogram_router)
app.include_router(price_histogram_router)
app.include_router(cache_debug_router)


@app.get("/health")
async def healthcheck(request: Request) -> dict[str, str]:
    async with request.app.state.pool.acquire() as conn:
        await conn.fetchval("SELECT 1")
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "3000"))
    uvicorn.run("server.server:app", host="0.0.0.0", port=port, reload=False)
