from typing import Any

from fastapi import APIRouter, Query, Request

from api.cache_keys import build_viewbbox_endpoint_cache_key
from api.sql_util.normalize import normalize_dimension, normalize_dimension_list, get_score_basis_column
from api.tile_api.tile_cache import _get_or_set_cached
from api.top_places_in_view_api.sql import TOP_PLACES_IN_VIEW_SQL

router = APIRouter()


@router.get("/api/places/top")
async def get_top_places_in_view(
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
    limit: int = Query(default=10, ge=1, le=50),
) -> dict[str, Any]:
    # Normalize filters: empty → '__all__' (no-filter marker), 'Unspecified' → '__null__' (sentinel)
    cuisine_values = normalize_dimension_list(cuisine)
    cost_values = normalize_dimension_list(cost)
    venue_value = normalize_dimension(venue_type)
    tier_column = get_score_basis_column(score_basis)

    top_places_cache_key = build_viewbbox_endpoint_cache_key(
        endpoint="top_places",
        scope="bbox_exact",
        sw_lat=sw_lat,
        sw_lng=sw_lng,
        ne_lat=ne_lat,
        ne_lng=ne_lng,
        parts=[
            str(res),
            ",".join(sorted(cuisine_values)),
            ",".join(sorted(cost_values)),
            venue_value,
            str(score_basis),
            str(score_tier),
            str(limit),
        ],
    )

    async def produce_top_places() -> dict[str, Any]:
        async with request.app.state.pool.acquire() as conn:
            rows = await conn.fetch(
                TOP_PLACES_IN_VIEW_SQL.format(rank_column=tier_column),
                sw_lat,
                ne_lat,
                sw_lng,
                ne_lng,
                cuisine_values,
                venue_value,
                cost_values,
                score_tier,
                limit,
            )

        return {
            "data": [dict(row) for row in rows],
            "total": len(rows),
            "limit": limit,
        }

    return await _get_or_set_cached(top_places_cache_key, produce_top_places)
