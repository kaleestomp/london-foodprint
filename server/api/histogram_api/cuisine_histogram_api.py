import asyncio
import os
import time
from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request

from api.cache_keys import build_viewbbox_endpoint_cache_key
from api.sql_util.normalize import normalize_dimension, normalize_dimension_list, get_score_basis_column
from api.histogram_api.sql import SQL_CITYWIDE_CUISINE, SQL_VIEW_CUISINE
router = APIRouter()

try:
    _CACHE_TTL = int(os.getenv("HISTOGRAM_CACHE_TTL_SECONDS", "120"))
except ValueError:
    _CACHE_TTL = 120
_cache: dict[str, tuple[float, list[dict[str, Any]]]] = {}
_cache_lock = asyncio.Lock()


async def get_cuisine_histogram_cache_stats(now: float | None = None) -> dict[str, int]:
    current = time.time() if now is None else now
    async with _cache_lock:
        total = len(_cache)
        live = sum(1 for cached_at, _ in _cache.values() if current - cached_at <= _CACHE_TTL)
    expired = total - live
    return {
        "total": total,
        "live": live,
        "expired": expired,
        "ttl_seconds": _CACHE_TTL,
    }




@router.get("/api/cuisine_histogram")
async def get_cuisine_histogram(
    request: Request,
    scope: str = Query(default="citywide"),
    sw_lat: float | None = Query(default=None),
    sw_lng: float | None = Query(default=None),
    ne_lat: float | None = Query(default=None),
    ne_lng: float | None = Query(default=None),
    cost: list[str] | None = Query(default=None),
    venue_type: str | None = Query(default=""),
    score_basis: int = Query(default=0, ge=0, le=2),
    score_tier: int = Query(default=0, ge=0, le=4),
) -> dict[str, Any]:
    if scope not in {"view", "citywide"}:
        raise HTTPException(status_code=422, detail="scope must be 'view' or 'citywide'")
    if scope == "view" and any(v is None for v in (sw_lat, sw_lng, ne_lat, ne_lng)):
        raise HTTPException(status_code=422, detail="sw_lat, sw_lng, ne_lat, ne_lng are required for scope=view")

    # Normalize filters: empty → '__all__' (no-filter marker), 'Unspecified' → '__null__' (sentinel)
    cost_values = normalize_dimension_list(cost)
    venue_value = normalize_dimension(venue_type)
    tier_column = get_score_basis_column(score_basis)

    if scope == "citywide":
        cache_key = build_viewbbox_endpoint_cache_key(
            endpoint="citywide",
            scope="citywide",
            parts=[
                ",".join(sorted(cost_values)),
                venue_value,
                str(score_basis),
                str(score_tier),
            ],
        )
    else:
        cache_key = build_viewbbox_endpoint_cache_key(
            endpoint="view",
            scope="bbox_exact",
            sw_lat=float(sw_lat),
            sw_lng=float(sw_lng),
            ne_lat=float(ne_lat),
            ne_lng=float(ne_lng),
            parts=[
                ",".join(sorted(cost_values)),
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
                return {"cuisine_histogram": data}
            del _cache[cache_key]

    async with request.app.state.pool.acquire() as conn:
        if scope == "citywide":
            rows = await conn.fetch(
                SQL_CITYWIDE_CUISINE.format(rank_column=tier_column),
                venue_value,
                cost_values,
                score_tier,
            )
        else:
            rows = await conn.fetch(
                SQL_VIEW_CUISINE.format(rank_column=tier_column),
                sw_lat,
                ne_lat,
                sw_lng,
                ne_lng,
                venue_value,
                cost_values,
                score_tier,
            )

    data = [dict(row) for row in rows]
    async with _cache_lock:
        _cache[cache_key] = (time.time(), data)

    return {"cuisine_histogram": data}
