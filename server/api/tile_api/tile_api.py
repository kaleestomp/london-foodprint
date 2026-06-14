from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request
from api.tile_api.tile_cache import _cache_key, _get_cached, _set_cached
from api.map_common import (
    PAGE_SIZE,
    RANK_THRESHOLD_MAP,
    get_rank_column,
    h3_cells_for_bbox,
    normalize_dimension,
    normalize_dimension_list,
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
    cost: str | None = Query(default=""),
    venue_type: str | None = Query(default=""),
    score_basis: int = Query(default=0, ge=0, le=1),
    confidence: int = Query(default=1, ge=0, le=2),
    score_tier: int = Query(default=0),
    places_only: bool = Query(default=False),
) -> dict[str, Any]:
    if score_tier not in RANK_THRESHOLD_MAP:
        raise HTTPException(status_code=422, detail="score_tier must be one of 0,2,3,4")
    if places_only and res < 10:
        raise HTTPException(status_code=422, detail="places_only requires res=10")

    cuisine_values = normalize_dimension_list(cuisine)
    cost_value = normalize_dimension(cost)
    venue_value = normalize_dimension(venue_type)
    resolution = res
    rank_column = get_rank_column(score_basis)
    rank_threshold = RANK_THRESHOLD_MAP[score_tier]

    outer_tiles, inner_tiles = h3_cells_for_bbox(sw_lat, sw_lng, ne_lat, ne_lng, resolution)
    # Cache key is keyed on outer_tiles — small pans that don't change the
    # padded set still get a cache hit.
    cache_key = _cache_key(
        outer_tiles,
        resolution,
        cuisine_values,
        cost_value,
        venue_value,
        score_basis,
        confidence,
        score_tier,
    )

    cached = await _get_cached(cache_key)
    if cached is not None:
        return cached

    # --- places_only fast-path: skip density query entirely ---
    if places_only:
        NEW_LIMIT = 100
        places_direct_sql = f"""
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
                            AND (COALESCE(array_length($5::TEXT[], 1), 0) = 0 OR cuisine_type = ANY($5::TEXT[]))
              AND ($6 = '' OR cost = $6)
              AND ($7 = '' OR venue_type = $7)
              AND {rank_column} >= $8
            ORDER BY {rank_column} DESC
            LIMIT {NEW_LIMIT}
        """
        async with request.app.state.pool.acquire() as conn:
            rows = await conn.fetch(
                places_direct_sql,
                sw_lat, ne_lat, sw_lng, ne_lng,
                cuisine_values, cost_value, venue_value,
                rank_threshold,
            )
        payload = {
            "mode": "places",
            "data": [dict(row) for row in rows],
            "total": len(rows),
        }
        await _set_cached(cache_key, payload)
        return payload
    # ----------------------------------------------------------

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
                    AND (COALESCE(array_length($5::TEXT[], 1), 0) = 0 OR cuisine_type = ANY($5::TEXT[]))
          AND ($6 = '' OR cost = $6)
          AND ($7 = '' OR venue_type = $7)
          AND {rank_column} >= $8
        ORDER BY {rank_column} DESC
        LIMIT {PAGE_SIZE}
    """

    async with request.app.state.pool.acquire() as conn:
        if cuisine_values:
            tiles_sql = """
                SELECT tile, SUM(count)::INT AS count
                FROM h3_density
                WHERE resolution = $1
                  AND tile = ANY($2::TEXT[])
                  AND cuisine_type = ANY($3::TEXT[])
                  AND cost = $4
                  AND venue_type = $5
                  AND score_basis = $6
                  AND confidence = $7
                  AND score_tier = $8
                GROUP BY tile
            """
            tile_rows = await conn.fetch(
                tiles_sql,
                resolution,
                outer_tiles,  # padded — covers intersecting edge tiles for heatmap
                cuisine_values,
                cost_value,
                venue_value,
                score_basis,
                confidence,
                score_tier,
            )
        else:
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
            tile_rows = await conn.fetch(
                tiles_sql,
                resolution,
                outer_tiles,  # padded — covers intersecting edge tiles for heatmap
                "",
                cost_value,
                venue_value,
                score_basis,
                confidence,
                score_tier,
            )

        # Use only the inner (unpadded) tiles to decide whether to fall back to
        # the places query — avoids counting edge tiles that are barely visible.
        inner_set = set(inner_tiles)
        inner_count = sum(int(row["count"]) for row in tile_rows if row["tile"] in inner_set)

        if inner_count <= PAGE_SIZE:
            rows = await conn.fetch(
                places_sql,
                sw_lat,
                ne_lat,
                sw_lng,
                ne_lng,
                cuisine_values,
                cost_value,
                venue_value,
                rank_threshold,
            )
            # places_sql already uses PAGE_SIZE limit (20)
            payload = {
                "mode": "places",
                "data": [dict(row) for row in rows],
                "total": inner_count,
            }
            await _set_cached(cache_key, payload)
            return payload

    payload = {
        "mode": "tiles",
        "resolution": resolution,
        "data": [dict(row) for row in tile_rows],
    }
    await _set_cached(cache_key, payload)
    return payload
