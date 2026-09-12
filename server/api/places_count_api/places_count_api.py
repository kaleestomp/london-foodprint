from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request

from api.sql_util.normalize import get_score_basis_column, normalize_dimension, normalize_dimension_list

router = APIRouter()


def _spatial_clause(scope: str) -> tuple[str, int]:
    if scope == "view":
        return "lat BETWEEN $5 AND $6 AND lon BETWEEN $7 AND $8", 8
    if scope == "nearby":
        return (
            "ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography, $7)",
            7,
        )
    return "TRUE", 4


def _build_sql(scope: str, rank_column: str) -> str:
    spatial_clause, _ = _spatial_clause(scope)
    tier_parameter = 9 if scope == "view" else 8 if scope == "nearby" else 5
    return f"""
        SELECT
            COUNT(*)::INT AS total,
            COUNT(*) FILTER (WHERE {rank_column} >= ${tier_parameter})::INT AS count
        FROM places
        WHERE city_slug = $1
          AND (
                CARDINALITY($2::TEXT[]) = 0
                OR cuisine_type = ANY(ARRAY_REMOVE($2::TEXT[], '__null__'))
                OR ('__null__' = ANY($2::TEXT[]) AND cuisine_type IS NULL)
              )
          AND (
                $3 = '__all__'
                OR ($3 = '__null__' AND venue_type IS NULL)
                OR ($3 != '__all__' AND $3 != '__null__' AND venue_type = $3)
              )
          AND (
                CARDINALITY($4::TEXT[]) = 0
                OR cost = ANY(ARRAY_REMOVE($4::TEXT[], '__null__'))
                OR ('__null__' = ANY($4::TEXT[]) AND cost IS NULL)
              )
          AND {spatial_clause}
    """


@router.get("/api/places/count")
async def get_places_count(
    request: Request,
    city: str = Query(default="london"),
    scope: str = Query(default="view"),
    lat: float | None = Query(default=None),
    lng: float | None = Query(default=None),
    radius_m: float | None = Query(default=None, gt=0),
    sw_lat: float | None = Query(default=None),
    sw_lng: float | None = Query(default=None),
    ne_lat: float | None = Query(default=None),
    ne_lng: float | None = Query(default=None),
    cuisine: list[str] | None = Query(default=None),
    cost: list[str] | None = Query(default=None),
    venue_type: str | None = Query(default=""),
    score_basis: int = Query(default=0, ge=0, le=2),
    score_tier: int = Query(default=0, ge=0, le=4),
    requestTierRep: bool = Query(default=False),
) -> dict[str, Any]:
    if scope not in {"view", "nearby", "citywide"}:
        raise HTTPException(status_code=422, detail="scope must be 'view', 'nearby', or 'citywide'")
    if scope == "view" and any(value is None for value in (sw_lat, sw_lng, ne_lat, ne_lng)):
        raise HTTPException(status_code=422, detail="sw_lat, sw_lng, ne_lat, ne_lng are required for scope=view")
    if scope == "nearby" and any(value is None for value in (lat, lng, radius_m)):
        raise HTTPException(status_code=422, detail="lat, lng, radius_m are required for scope=nearby")

    cuisine_values = normalize_dimension_list(cuisine)
    cost_values = normalize_dimension_list(cost)
    venue_value = normalize_dimension(venue_type)
    city_slug = city.lower().strip()
    rank_column = get_score_basis_column(score_basis)

    if scope == "view":
        query_args = (
            city_slug, cuisine_values, venue_value, cost_values,
            sw_lat, ne_lat, sw_lng, ne_lng, score_tier,
        )
    elif scope == "nearby":
        query_args = (
            city_slug, cuisine_values, venue_value, cost_values,
            lng, lat, radius_m, score_tier,
        )
    else:
        query_args = (city_slug, cuisine_values, venue_value, cost_values, score_tier)

    async with request.app.state.pool.acquire() as conn:
        row = await conn.fetchrow(_build_sql(scope, rank_column), *query_args)

    count = int(row["count"])
    total = int(row["total"])
    return {
        "count": count,
        "tierRep": round((count / total) * 100, 2) if requestTierRep and total else None,
    }