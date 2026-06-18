import math
from typing import Any

import h3
from fastapi import APIRouter, Query, Request
from api.sql_util.normalize import normalize_dimension, normalize_dimension_list, get_score_basis_column
from api.nearby_api.sql import SQL_NEARBY
from api.map_common import PAGE_SIZE_ON_REQUEST

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
    score_basis: int = Query(default=0, ge=0, le=2),
    score_tier: int = Query(default=0),
    page: int = Query(default=1, ge=1),
) -> dict[str, Any]:
    cuisine_values = normalize_dimension_list(cuisine)
    cost_values = normalize_dimension_list(cost)
    venue_value = normalize_dimension(venue_type)
    tier_column = get_score_basis_column(score_basis)
    center_r10 = h3.latlng_to_cell(lat, lng, 10)
    k = math.ceil(radius_m / 114.2) + 1
    ring_cells = [str(cell) for cell in h3.grid_disk(center_r10, k)]
    offset = (page - 1) * PAGE_SIZE_ON_REQUEST

    async with request.app.state.pool.acquire() as conn:
        rows = await conn.fetch(
            SQL_NEARBY.format(rank_column=tier_column, page_size=PAGE_SIZE_ON_REQUEST),
            ring_cells,
            lng,
            lat,
            radius_m,
            cuisine_values,
            venue_value,
            cost_values,
            score_tier,
            offset,
        )

    return {
        "page": page,
        "page_size": PAGE_SIZE_ON_REQUEST,
        "data": [dict(row) for row in rows],
    }
