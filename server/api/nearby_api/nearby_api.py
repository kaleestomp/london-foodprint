import math
from typing import Any

import h3
from fastapi import APIRouter, Query, Request

from api.map_common import get_rank_column, normalize_dimension, normalize_dimension_list
PAGE_SIZE = 80
router = APIRouter()


@router.get("/api/nearby")
async def get_nearby(
    request: Request,
    lat: float = Query(...),
    lng: float = Query(...),
    radius_m: float = Query(default=1000, gt=0, le=10000),
    cuisine: list[str] | None = Query(default=None),
    cost: list[str] | None = Query(default=None),
    venue_type: str | None = Query(default=""),
    score_basis: int = Query(default=0, ge=0, le=1),
    rank_threshold: float = Query(default=0.0, ge=0.0, le=1.0),
    page: int = Query(default=1, ge=1),
) -> dict[str, Any]:
    cuisine_values = normalize_dimension_list(cuisine)
    cost_values = normalize_dimension_list(cost)
    venue_value = normalize_dimension(venue_type)
    rank_column = get_rank_column(score_basis)
    center_r10 = h3.latlng_to_cell(lat, lng, 10)
    k = math.ceil(radius_m / 114.2) + 1
    ring_cells = [str(cell) for cell in h3.grid_disk(center_r10, k)]
    offset = (page - 1) * PAGE_SIZE

    sql = f"""
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
        WHERE h3_r10 = ANY($1::TEXT[])
          AND ST_DWithin(
              geom::geography,
              ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
              $4
          )
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
        LIMIT {PAGE_SIZE}
        OFFSET $9
    """

    async with request.app.state.pool.acquire() as conn:
        rows = await conn.fetch(
            sql,
            ring_cells,
            lng,
            lat,
            radius_m,
            cuisine_values,
            venue_value,
            cost_values,
            rank_threshold,
            offset,
        )

    return {
        "page": page,
        "page_size": PAGE_SIZE,
        "data": [dict(row) for row in rows],
    }
