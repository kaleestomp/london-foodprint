from typing import Any

from fastapi import APIRouter, Query, Request

from api.sql_util.normalize import normalize_dimension, normalize_dimension_list, get_score_basis_column
from api.places_list_api.sql import SQL_PLACES_LIST

DEFAULT_PAGE_SIZE = 10
router = APIRouter()


@router.get("/api/places/list")
async def get_places_list(
    request: Request,
    sw_lat: float = Query(...),
    sw_lng: float = Query(...),
    ne_lat: float = Query(...),
    ne_lng: float = Query(...),
    center_lat: float | None = Query(default=None),
    center_lng: float | None = Query(default=None),
    radius_m: float | None = Query(default=None, gt=0),
    cuisine: list[str] | None = Query(default=None),
    cost: list[str] | None = Query(default=None),
    venue_type: str | None = Query(default=""),
    rank_column: str = Query(default="normal_1"),
    score_basis: int | None = Query(default=None, ge=0, le=2),
    score_tier: int = Query(default=0, ge=0, le=4),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1)
) -> dict[str, Any]:
    """
    Fetch paginated list of places with optional circle filter.
    
    ⚠️  IMPORTANT: This endpoint has TWO independent ranking parameters:
    1. rank_column (normal_1 or wilson_1): Controls ORDER BY and SELECT (sorting)
    2. score_basis (0/1/2 → tier/tier_d/tier_independent): Controls WHERE clause (filtering)
    
    These are INDEPENDENT. Selecting rank_column="wilson_1" with score_basis=1 will:
    - ORDER/SELECT by: wilson_1 column (score basis 1)
    - WHERE filter by: tier_d column (score basis 1, diversity-aware)
    
    If they mismatch, the ranking may not correspond to the filter tier. This is intentional
    to allow exploring different ranking vs filtering combinations.
    """
    # Normalize filters: empty → '__all__' (no-filter marker), 'Unspecified' → '__null__' (sentinel)
    cuisine_values = normalize_dimension_list(cuisine)
    cost_values = normalize_dimension_list(cost)
    venue_value = normalize_dimension(venue_type)
    allowed_rank_columns = {"normal_1", "wilson_1"}
    sort_column = rank_column if rank_column in allowed_rank_columns else "normal_1"
    tier_filter = ""
    if score_basis is not None:
        tier_column = get_score_basis_column(score_basis)
        tier_filter = f"AND {tier_column} >= $12"
    offset = (page - 1) * page_size
    has_circle_filter = center_lat is not None and center_lng is not None and radius_m is not None

    sql = SQL_PLACES_LIST.format(
        sort_column=sort_column,
        tier_filter=tier_filter,
        page_size=page_size
    )
    # ORDER BY {sort_column} DESC, id ASC 
    # (Previous) ORDER BY {sort_column} DESC 
    # id ASC added the second sort key by id 
    # in case the rank is tied 
    async with request.app.state.pool.acquire() as conn:
        rows = await conn.fetch(
            sql,
            sw_lat,
            ne_lat,
            sw_lng,
            ne_lng,
            cuisine_values,
            venue_value,
            cost_values,
            has_circle_filter,
            center_lat if center_lat is not None else 0.0,
            center_lng if center_lng is not None else 0.0,
            radius_m if radius_m is not None else 0.0,
            score_tier,
            offset,
        )

    return {
        "page": page,
        "page_size": len(rows),
        "data": [dict(row) for row in rows],
    }
