from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request
from api.cache_keys import build_viewbbox_endpoint_cache_key
from api.tile_api.tile_cache import (
    _get_cached,
    _set_cached,
    _get_or_set_cached,
    _run_singleflight,
)
from api.tile_api.sql import PLACES_SQL, TILES_SQL
from api.sql_util.normalize import normalize_dimension, normalize_dimension_list, get_score_basis_column
from server.api.map_util.map_util import (
    PAGE_SIZE_ON_ZOOM,
    PAGE_SIZE_ON_REQUEST,
    h3_cells_for_bbox,
)
router = APIRouter()

@router.get("/api/tiles")
async def get_tiles(
    request: Request,
    sw_lat: float = Query(...),
    sw_lng: float = Query(...),
    ne_lat: float = Query(...),
    ne_lng: float = Query(...),
    res: int = Query(..., ge=7, le=10),
    cuisine: list[str] | None = Query(default=None),
    cost: list[str] | None = Query(default=None),
    venue_type: str | None = Query(default=""),
    score_basis: int = Query(default=0, ge=0, le=2),
    score_tier: int = Query(default=0),
    places_only: bool = Query(default=False),
) -> dict[str, Any]:
    
    # VALIDATE INPUTS
    if places_only and res < 10:
        raise HTTPException(status_code=422, detail="places_only requires res=10")

    cuisine_values = normalize_dimension_list(cuisine)
    cost_values = normalize_dimension_list(cost)
    venue_value = normalize_dimension(venue_type)
    resolution = res
    tier_column = get_score_basis_column(score_basis)
    outer_tiles, inner_tiles = h3_cells_for_bbox(sw_lat, sw_lng, ne_lat, ne_lng, resolution)

    # CREATE CACHE KEYS
    # Tiles cache key uses padded outer tiles so small pans can hit cache.
    tiles_cache_key = build_viewbbox_endpoint_cache_key(
        endpoint="tiles",
        scope="tiles_outer_snapped",
        resolution=resolution,
        cuisine_values=cuisine_values,
        cost_values=cost_values,
        venue_value=venue_value,
        score_basis=score_basis,
        score_tier=score_tier,
        snapped_tiles=outer_tiles,
        parts=[],
    )
    # Places payloads are bbox-precise and intentionally ignore snapped tile sets.
    places_cache_key = build_viewbbox_endpoint_cache_key(
        endpoint="places",
        scope="bbox_exact",
        sw_lat=sw_lat,
        sw_lng=sw_lng,
        ne_lat=ne_lat,
        ne_lng=ne_lng,
        parts=[
            str(resolution),
            ",".join(sorted(cuisine_values)),
            ",".join(sorted(cost_values)),
            venue_value,
            str(score_basis),
            str(score_tier),
        ],
    )

    # --- places_only fast-path: skip density query entirely ---
    if places_only:
        async def produce_places_only() -> dict[str, Any]:
            async with request.app.state.pool.acquire() as conn:
                rows = await conn.fetch(
                    PLACES_SQL.format(rank_column=tier_column, page_size=PAGE_SIZE_ON_REQUEST),
                    sw_lat, ne_lat, sw_lng, ne_lng,
                    cuisine_values, venue_value, cost_values,
                    score_tier,
                )
            return {
                "mode": "places",
                "data": [dict(row) for row in rows],
                "total": len(rows),
            }

        return await _get_or_set_cached(places_cache_key, produce_places_only)
    # ----------------------------------------------------------

    # --- default: tile query first ---
    # Check for exact-bbox places cache first.
    cached_places = await _get_cached(places_cache_key)
    if cached_places is not None:
        return cached_places
    # Check for snapped-tiles cache next.
    cached_tiles = await _get_cached(tiles_cache_key)
    if cached_tiles is not None:
        return cached_tiles
    
    # If neither cache hit, query the tiles table.
    # Coalesce concurrent misses by snapped tile key to avoid duplicate DB work.
    async def produce_tile_rows() -> Any:
        async with request.app.state.pool.acquire() as conn:
            return await conn.fetch(
                TILES_SQL,
                resolution,
                outer_tiles,
                cuisine_values,
                cost_values,
                venue_value,
                score_basis,
                score_tier,
            )

    tile_rows = await _run_singleflight(f"tile_rows|{tiles_cache_key}", produce_tile_rows)

    # Use only the inner (unpadded) tiles to decide whether to fall back to
    # the places query — avoids counting edge tiles that are barely visible.
    inner_set = set(inner_tiles)
    inner_count = sum(int(row["count"]) for row in tile_rows if row["tile"] in inner_set)

    if inner_count <= PAGE_SIZE_ON_ZOOM:
        async def produce_places_fallback() -> dict[str, Any]:
            async with request.app.state.pool.acquire() as fallback_conn:
                fallback_rows = await fallback_conn.fetch(
                    PLACES_SQL.format(rank_column=tier_column, page_size=int(PAGE_SIZE_ON_ZOOM * 1.5)),
                    sw_lat,
                    ne_lat,
                    sw_lng,
                    ne_lng,
                    cuisine_values,
                    venue_value,
                    cost_values,
                    score_tier,
                )
            # Note: Use actual len(rows) as total, not inner_count.
            # H3 tiles don't perfectly align with lat/lon bboxes, so a place inside an
            # inner tile may fall outside the exact bbox bounds. inner_count is a heuristic
            # for switching modes; the true count is what the places query returns.
            return {
                "mode": "places",
                "data": [dict(row) for row in fallback_rows],
                "total": len(fallback_rows),
            }

        return await _get_or_set_cached(places_cache_key, produce_places_fallback)

    payload = {
        "mode": "tiles",
        "resolution": resolution,
        "data": [dict(row) for row in tile_rows],
    }
    await _set_cached(tiles_cache_key, payload)
    return payload
