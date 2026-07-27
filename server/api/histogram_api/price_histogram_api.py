import asyncio
import os
import time
from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request
from api.cache_keys import build_endpoint_cache_key
from api.sql_util.normalize import normalize_dimension, normalize_dimension_list, get_score_basis_column
from api.histogram_api.sql import SQL_CITYWIDE_PRICE, SQL_NEARBY_PRICE, SQL_VIEW_PRICE

router = APIRouter()

try:
    _CACHE_TTL = int(os.getenv("HISTOGRAM_CACHE_TTL_SECONDS", "120"))
except ValueError:
    _CACHE_TTL = 120
_cache: dict[str, tuple[float, list[dict[str, Any]]]] = {}
_cache_lock = asyncio.Lock()




@router.get("/api/cost_histogram")
async def get_cost_histogram(
    request: Request,
    scope: str = Query(default="citywide"),
    lat: float | None = Query(default=None),
    lng: float | None = Query(default=None),
    radius_m: float | None = Query(default=None, gt=0),
    sw_lat: float | None = Query(default=None),
    sw_lng: float | None = Query(default=None),
    ne_lat: float | None = Query(default=None),
    ne_lng: float | None = Query(default=None),
    cuisine: list[str] | None = Query(default=None),
    venue_type: str | None = Query(default=""),
    score_basis: int = Query(default=0, ge=0, le=2),
    score_tier: int = Query(default=0, ge=0, le=4),
) -> dict[str, Any]:
    if scope not in {"view", "citywide", "nearby"}:
        raise HTTPException(status_code=422, detail="scope must be 'view', 'nearby', or 'citywide'")
    if scope == "view" and any(v is None for v in (sw_lat, sw_lng, ne_lat, ne_lng)):
        raise HTTPException(status_code=422, detail="sw_lat, sw_lng, ne_lat, ne_lng are required for scope=view")
    if scope == "nearby" and any(v is None for v in (lat, lng, radius_m)):
        raise HTTPException(status_code=422, detail="lat, lng, radius_m are required for scope=nearby")

    # Normalize filters: empty → '__all__' (no-filter marker), 'Unspecified' → '__null__' (sentinel)
    cuisine_values = normalize_dimension_list(cuisine)
    venue_value = normalize_dimension(venue_type)
    tier_column = get_score_basis_column(score_basis)

    # Citywide cache key is viewport-independent — stays valid across pans.
    cache_key: str | None = None
    if scope == "citywide":
        cache_key = build_endpoint_cache_key(
            endpoint="citywide",
            scope="citywide",
            parts=[
                ",".join(sorted(cuisine_values)),
                venue_value,
                str(score_basis),
                str(score_tier),
            ],
        )
        now = time.time()
        async with _cache_lock:
            entry = _cache.get(cache_key)
            if entry is not None:
                cached_at, data = entry
                if now - cached_at <= _CACHE_TTL:
                    return {"cost_histogram": data}
                del _cache[cache_key]

    async with request.app.state.pool.acquire() as conn:
        if scope == "citywide":
            rows = await conn.fetch(
                SQL_CITYWIDE_PRICE.format(rank_column=tier_column),
                cuisine_values, venue_value, score_tier,
            )
        elif scope == "nearby":
            rows = await conn.fetch(
                SQL_NEARBY_PRICE.format(rank_column=tier_column),
                lng, lat, radius_m,
                cuisine_values,
                venue_value,
                score_tier,
            )
        else:
            rows = await conn.fetch(
                SQL_VIEW_PRICE.format(rank_column=tier_column),
                sw_lat, ne_lat, sw_lng, ne_lng,
                cuisine_values, venue_value, score_tier,
            )

    data = [dict(row) for row in rows]
    if scope == "citywide" and cache_key is not None:
        async with _cache_lock:
            _cache[cache_key] = (time.time(), data)

    return {"cost_histogram": data}
