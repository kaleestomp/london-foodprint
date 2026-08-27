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
    center_lat: float | None = Query(default=None),
    center_lng: float | None = Query(default=None),
    radius_m: float | None = Query(default=None, gt=0),
    cuisine: list[str] | None = Query(default=None),
    cost: list[str] | None = Query(default=None),
    venue_type: str | None = Query(default=""),
    rank_column: str = Query(default="normal_1"),
    score_basis: int = Query(default=0, ge=0, le=2),
    score_tier: int = Query(default=0, ge=0, le=4),
    page: int = Query(default=1, ge=1),
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
    tier_column = get_score_basis_column(score_basis)
    offset = (page - 1) * PAGE_SIZE
    has_circle_filter = center_lat is not None and center_lng is not None and radius_m is not None

    sql = f"""
        SELECT
            {sort_column} AS ranking,
            display_name,
            cuisine_type,
            cost AS price,
            CASE
                WHEN $8::BOOLEAN THEN (
                    6371000 * 2 * ASIN(
                        SQRT(
                            POWER(SIN(RADIANS((lat - $9) / 2)), 2)
                            + COS(RADIANS($9)) * COS(RADIANS(lat))
                            * POWER(SIN(RADIANS((lon - $10) / 2)), 2)
                        )
                    )
                )
                ELSE NULL
            END AS distance_m,
            is_chain,
            venue_type,
            google_maps_uri,
            website_uri
        FROM places
        WHERE lat BETWEEN $1 AND $2
          AND lon BETWEEN $3 AND $4
          AND (
                CARDINALITY($5::TEXT[]) = 0  -- no filter, show all cuisines
                OR (CARDINALITY($5::TEXT[]) > 0 AND (
                      cuisine_type = ANY(ARRAY_REMOVE($5::TEXT[], '__null__'))
                      OR ('__null__' = ANY($5::TEXT[]) AND cuisine_type IS NULL)
                    ))
              )
          AND (
                $6 = '__all__'  -- no filter, all venues
                OR ($6 = '__null__' AND venue_type IS NULL)
                OR ($6 != '__all__' AND $6 != '__null__' AND venue_type = $6)
              )
          AND (
                CARDINALITY($7::TEXT[]) = 0  -- no filter, show all costs
                OR (CARDINALITY($7::TEXT[]) > 0 AND (
                      cost = ANY(ARRAY_REMOVE($7::TEXT[], '__null__'))
                      OR ('__null__' = ANY($7::TEXT[]) AND cost IS NULL)
                    ))
              )
          AND (
                NOT $8::BOOLEAN
                OR (
                    6371000 * 2 * ASIN(
                        SQRT(
                            POWER(SIN(RADIANS((lat - $9) / 2)), 2)
                            + COS(RADIANS($9)) * COS(RADIANS(lat))
                            * POWER(SIN(RADIANS((lon - $10) / 2)), 2)
                        )
                    ) <= $11
                )
              )
          AND {tier_column} >= $12
        ORDER BY {sort_column} DESC, id ASC 
        LIMIT {PAGE_SIZE}
        OFFSET $13
    """
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
        "page_size": PAGE_SIZE,
        "data": [dict(row) for row in rows],
    }
