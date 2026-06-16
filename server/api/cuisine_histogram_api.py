import asyncio
import os
import time
from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request

from api.map_common import RANK_THRESHOLD_MAP, get_rank_column, normalize_dimension, normalize_dimension_list

router = APIRouter()

try:
    _CACHE_TTL = int(os.getenv("HISTOGRAM_CACHE_TTL_SECONDS", "120"))
except ValueError:
    _CACHE_TTL = 120
_cache: dict[str, tuple[float, list[dict[str, Any]]]] = {}
_cache_lock = asyncio.Lock()

_SQL_CITYWIDE = """
    SELECT cuisine_type AS cuisine, COUNT(*)::INT AS count
    FROM places
    WHERE cuisine_type IS NOT NULL
      AND cuisine_type <> ''
      AND ($1 = '' OR venue_type = $1)
      AND (
            COALESCE(array_length($2::TEXT[], 1), 0) = 0
            OR cost = ANY($2::TEXT[])
            OR cost IS NULL
            OR cost = ''
            OR LOWER(cost) = 'unspecified'
          )
      AND {rank_column} >= $3
    GROUP BY cuisine_type
    ORDER BY count DESC, cuisine_type ASC
"""

_SQL_VIEW = """
    SELECT cuisine_type AS cuisine, COUNT(*)::INT AS count
    FROM places
    WHERE lat BETWEEN $1 AND $2
      AND lon BETWEEN $3 AND $4
      AND cuisine_type IS NOT NULL
      AND cuisine_type <> ''
      AND ($5 = '' OR venue_type = $5)
      AND (
            COALESCE(array_length($6::TEXT[], 1), 0) = 0
            OR cost = ANY($6::TEXT[])
            OR cost IS NULL
            OR cost = ''
            OR LOWER(cost) = 'unspecified'
          )
      AND {rank_column} >= $7
    GROUP BY cuisine_type
    ORDER BY count DESC, cuisine_type ASC
"""


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
    score_basis: int = Query(default=0, ge=0, le=1),
    score_tier: int = Query(default=0),
) -> dict[str, Any]:
    if scope not in {"view", "citywide"}:
        raise HTTPException(status_code=422, detail="scope must be 'view' or 'citywide'")
    if scope == "view" and any(v is None for v in (sw_lat, sw_lng, ne_lat, ne_lng)):
        raise HTTPException(status_code=422, detail="sw_lat, sw_lng, ne_lat, ne_lng are required for scope=view")
    if score_tier not in RANK_THRESHOLD_MAP:
        raise HTTPException(status_code=422, detail="score_tier must be one of 0,1,2,3,4")

    cost_values = normalize_dimension_list(cost)
    venue_value = normalize_dimension(venue_type)
    rank_column = get_rank_column(score_basis)
    rank_threshold = RANK_THRESHOLD_MAP[score_tier]

    if scope == "citywide":
        cache_key = "|".join(["citywide", ",".join(sorted(cost_values)), venue_value, str(score_basis), str(rank_threshold)])
    else:
        cache_key = "|".join([
            "view", str(sw_lat), str(sw_lng), str(ne_lat), str(ne_lng),
            ",".join(sorted(cost_values)), venue_value, str(score_basis), str(rank_threshold),
        ])

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
                _SQL_CITYWIDE.format(rank_column=rank_column),
                venue_value,
                cost_values,
                rank_threshold,
            )
        else:
            rows = await conn.fetch(
                _SQL_VIEW.format(rank_column=rank_column),
                sw_lat,
                ne_lat,
                sw_lng,
                ne_lng,
                venue_value,
                cost_values,
                rank_threshold,
            )

    data = [dict(row) for row in rows]
    async with _cache_lock:
        _cache[cache_key] = (time.time(), data)

    return {"cuisine_histogram": data}
