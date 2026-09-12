from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request

from api.sql_util.normalize import get_score_basis_column, normalize_dimension, normalize_dimension_list
from api.places_count_api.sql import SQL_PLACE_COUNT


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
    sql_query = SQL_PLACE_COUNT.format(rank_column=rank_column, tier_parameter=tier_parameter, spatial_clause=spatial_clause)
    return sql_query


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