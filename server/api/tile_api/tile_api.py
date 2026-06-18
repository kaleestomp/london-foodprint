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

_PLACES_ONLY_SQL = """
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
      AND ($6 = '' OR venue_type = $6)
      AND (
            COALESCE(array_length($7::TEXT[], 1), 0) = 0
            OR cost = ANY($7::TEXT[])
            OR cost IS NULL
            OR cost = ''
            OR LOWER(cost) = 'unspecified'
          )
            AND {rank_column} >= $8
        ORDER BY {rank_column} DESC
    LIMIT 100
"""

_PLACES_SQL = """
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
        {{rank_column}} AS rank
    FROM places
    WHERE lat BETWEEN $1 AND $2
      AND lon BETWEEN $3 AND $4
      AND (COALESCE(array_length($5::TEXT[], 1), 0) = 0 OR cuisine_type = ANY($5::TEXT[]))
      AND ($6 = '' OR venue_type = $6)
      AND (
            COALESCE(array_length($7::TEXT[], 1), 0) = 0
            OR cost = ANY($7::TEXT[])
            OR cost IS NULL
            OR cost = ''
            OR LOWER(cost) = 'unspecified'
          )
      AND {{rank_column}} >= $8
    ORDER BY {{rank_column}} DESC
    LIMIT {page_size}
""".format(page_size=PAGE_SIZE)

_TILES_SQL = """
    SELECT tile, SUM(count)::INT AS count
    FROM h3_density
    WHERE resolution = $1
      AND tile = ANY($2::TEXT[])
      AND (COALESCE(array_length($3::TEXT[], 1), 0) = 0 OR cuisine_type = ANY($3::TEXT[]))
      AND (
            COALESCE(array_length($4::TEXT[], 1), 0) = 0
            OR cost = ANY($4::TEXT[])
            OR cost = ''
            OR LOWER(cost) = 'unspecified'
          )
      AND ($5 = '' OR venue_type = $5)
      AND score_basis = $6
      AND score_tier = $7
    GROUP BY tile
"""


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
    score_basis: int = Query(default=0, ge=0, le=1),
    score_tier: int = Query(default=0),
    places_only: bool = Query(default=False),
) -> dict[str, Any]:
    if score_tier not in RANK_THRESHOLD_MAP:
        raise HTTPException(status_code=422, detail="score_tier must be one of 0,1,2,3,4")
    if places_only and res < 10:
        raise HTTPException(status_code=422, detail="places_only requires res=10")

    cuisine_values = normalize_dimension_list(cuisine)
    cost_values = normalize_dimension_list(cost)
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
        cost_values,
        venue_value,
        score_basis,
        score_tier,
    )

    cached = await _get_cached(cache_key)
    if cached is not None:
        return cached

    places_sql = _PLACES_SQL.format(rank_column=rank_column)

    # --- places_only fast-path: skip density query entirely ---
    if places_only:
        async with request.app.state.pool.acquire() as conn:
            rows = await conn.fetch(
                _PLACES_ONLY_SQL.format(rank_column=rank_column),
                sw_lat, ne_lat, sw_lng, ne_lng,
                cuisine_values, venue_value, cost_values,
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

    async with request.app.state.pool.acquire() as conn:
        tile_rows = await conn.fetch(
            _TILES_SQL,
            resolution,
            outer_tiles,
            cuisine_values,
            cost_values,
            venue_value,
            score_basis,
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
                venue_value,
                cost_values,
                rank_threshold,
            )
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
