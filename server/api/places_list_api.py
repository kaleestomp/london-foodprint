from typing import Any

from fastapi import APIRouter, Query, Request

from api.sql_util.normalize import normalize_dimension, normalize_dimension_list, get_score_basis_column

PAGE_SIZE = 20
router = APIRouter()


@router.get("/api/places/list")
async def get_places_list(
    request: Request,
    sw_lat: float = Query(...),
    sw_lng: float = Query(...),
    ne_lat: float = Query(...),
    ne_lng: float = Query(...),
    cuisine: list[str] | None = Query(default=None),
    cost: list[str] | None = Query(default=None),
    venue_type: str | None = Query(default=""),
    rank_column: str = Query(default="normal_1"),
    score_basis: int = Query(default=0, ge=0, le=2),
    score_tier: int = Query(default=0, ge=0, le=4),
    page: int = Query(default=1, ge=1),
) -> dict[str, Any]:
    cuisine_values = normalize_dimension_list(cuisine)
    cost_values = normalize_dimension_list(cost)
    venue_value = normalize_dimension(venue_type)
    allowed_rank_columns = {"normal_1", "wilson_1"}
    sort_column = rank_column if rank_column in allowed_rank_columns else "normal_1"
    tier_column = get_score_basis_column(score_basis)
    offset = (page - 1) * PAGE_SIZE

    sql = f"""
        SELECT
            normal_1 AS ranking,
            display_name,
            cuisine_type,
            is_chain,
            venue_type,
            google_maps_uri,
            website_uri
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
                    AND {tier_column} >= $8
                ORDER BY {sort_column} DESC
        LIMIT {PAGE_SIZE}
        OFFSET $9
    """

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
            score_tier,
            offset,
        )

    return {
        "page": page,
        "page_size": PAGE_SIZE,
        "data": [dict(row) for row in rows],
    }
