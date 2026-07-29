from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request

from api.sql_util.normalize import normalize_dimension, normalize_dimension_list, get_score_basis_column
from api.top_places_in_view_api.sql import TOP_PLACES_IN_VIEW_BBOX_SQL, TOP_PLACES_IN_VIEW_RADIUS_SQL

router = APIRouter()


@router.get("/api/places/top")
async def get_top_places_in_view(
    request: Request,
    sw_lat: float | None = Query(default=None),
    sw_lng: float | None = Query(default=None),
    ne_lat: float | None = Query(default=None),
    ne_lng: float | None = Query(default=None),
    lat: float | None = Query(default=None),
    lng: float | None = Query(default=None),
    radius_m: float | None = Query(default=None),
    cuisine: list[str] | None = Query(default=None),
    cost: list[str] | None = Query(default=None),
    venue_type: str | None = Query(default=""),
    score_basis: int = Query(default=0, ge=0, le=2),
    score_tier: int = Query(default=0, ge=0, le=4),
    limit: int = Query(default=10, ge=1, le=50),
) -> dict[str, Any]:
    # Normalize filters: empty → '__all__' (no-filter marker), 'Unspecified' → '__null__' (sentinel)
    cuisine_values = normalize_dimension_list(cuisine)
    cost_values = normalize_dimension_list(cost)
    venue_value = normalize_dimension(venue_type)
    tier_column = get_score_basis_column(score_basis)

    if lat is not None and lng is not None and radius_m is not None:
        query_sql = TOP_PLACES_IN_VIEW_RADIUS_SQL.format(rank_column=tier_column)
        params = (lat, lng, radius_m, cuisine_values, venue_value, cost_values, score_tier, limit)
    else:
        if sw_lat is None or sw_lng is None or ne_lat is None or ne_lng is None:
            raise HTTPException(status_code=400, detail='Provide either bbox params or radius params.')
        query_sql = TOP_PLACES_IN_VIEW_BBOX_SQL.format(rank_column=tier_column)
        params = (sw_lat, ne_lat, sw_lng, ne_lng, cuisine_values, venue_value, cost_values, score_tier, limit)

    async with request.app.state.pool.acquire() as conn:
        rows = await conn.fetch(query_sql, *params)

    return {
        "data": [dict(row) for row in rows],
        "total": len(rows),
        "limit": limit,
    }
