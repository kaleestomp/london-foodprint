from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request
from server.api.tile_api.tile_cache import _cache_key, _get_cached, _set_cached
from server.api.map_common import (
    PAGE_SIZE,
    RANK_THRESHOLD_MAP,
    get_rank_column,
    h3_cells_for_bbox,
    normalize_dimension,
    zoom_to_resolution,
)

router = APIRouter()

@router.get("/api/tiles")
async def get_tiles(
    request: Request,
    sw_lat: float = Query(...),
    sw_lng: float = Query(...),
    ne_lat: float = Query(...),
    ne_lng: float = Query(...),
    zoom: int = Query(..., ge=0, le=22),
    cuisine: str | None = Query(default=""),
    cost: str | None = Query(default=""),
    venue_type: str | None = Query(default=""),
    score_basis: int = Query(default=0, ge=0, le=1),
    confidence: int = Query(default=1, ge=0, le=2),
    score_tier: int = Query(default=0),
) -> dict[str, Any]:
    if score_tier not in RANK_THRESHOLD_MAP:
        raise HTTPException(status_code=422, detail="score_tier must be one of 1,2,3,4")

    cuisine_value = normalize_dimension(cuisine)
    cost_value = normalize_dimension(cost)
    venue_value = normalize_dimension(venue_type)
    resolution = zoom_to_resolution(zoom)
    rank_column = get_rank_column(score_basis)
    rank_threshold = RANK_THRESHOLD_MAP[score_tier]

    snapped_tiles = h3_cells_for_bbox(sw_lat, sw_lng, ne_lat, ne_lng, resolution)
    cache_key = _cache_key(
        snapped_tiles,
        resolution,
        cuisine_value,
        cost_value,
        venue_value,
        score_basis,
        confidence,
        score_tier,
    )

    cached = await _get_cached(cache_key)
    if cached is not None:
        return cached

    count_sql = f"""
        SELECT COUNT(*)::INT AS total
        FROM places
        WHERE lat BETWEEN $1 AND $2
          AND lon BETWEEN $3 AND $4
          AND ($5 = '' OR cuisine_type = $5)
          AND ($6 = '' OR cost = $6)
          AND ($7 = '' OR venue_type = $7)
          AND {rank_column} >= $8
    """

    places_sql = f"""
        SELECT
            id,
            display_name,
            lat,
            lon,
            cuisine_type,
            venue_type,
            cost,
            rating,
            user_rating_count,
            operational,
            {rank_column} AS rank
        FROM places
        WHERE lat BETWEEN $1 AND $2
          AND lon BETWEEN $3 AND $4
          AND ($5 = '' OR cuisine_type = $5)
          AND ($6 = '' OR cost = $6)
          AND ($7 = '' OR venue_type = $7)
          AND {rank_column} >= $8
        ORDER BY {rank_column} DESC
        LIMIT {PAGE_SIZE}
    """

    async with request.app.state.pool.acquire() as conn:
        total = await conn.fetchval(
            count_sql,
            sw_lat,
            ne_lat,
            sw_lng,
            ne_lng,
            cuisine_value,
            cost_value,
            venue_value,
            rank_threshold,
        )

        if total <= PAGE_SIZE:
            rows = await conn.fetch(
                places_sql,
                sw_lat,
                ne_lat,
                sw_lng,
                ne_lng,
                cuisine_value,
                cost_value,
                venue_value,
                rank_threshold,
            )
            payload = {
                "mode": "places",
                "data": [dict(row) for row in rows],
                "total": total,
            }
            await _set_cached(cache_key, payload)
            return payload

        tiles_sql = """
            SELECT tile, count
            FROM h3_density
            WHERE resolution = $1
              AND tile = ANY($2::TEXT[])
              AND cuisine_type = $3
              AND cost = $4
              AND venue_type = $5
              AND score_basis = $6
              AND confidence = $7
              AND score_tier = $8
        """
        rows = await conn.fetch(
            tiles_sql,
            resolution,
            snapped_tiles,
            cuisine_value,
            cost_value,
            venue_value,
            score_basis,
            confidence,
            score_tier,
        )

    payload = {
        "mode": "tiles",
        "resolution": resolution,
        "data": [dict(row) for row in rows],
    }
    await _set_cached(cache_key, payload)
    return payload
