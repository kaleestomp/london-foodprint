from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request

from api.sql_util.normalize import normalize_dimension, normalize_dimension_list, get_score_basis_column, get_wilson_basis_column
from api.sql_util.spatial import build_geometry_predicate, parse_geometry_search
from api.places_list_api.sql import SQL_PLACES_LIST, SQL_PLACES_LIST_GEOMETRY

DEFAULT_PAGE_SIZE = 10
router = APIRouter()


@router.get("/api/places/list")
async def get_places_list(
    request: Request,
    city: str = Query(default="london"),
    sw_lat: float | None = Query(default=None),
    sw_lng: float | None = Query(default=None),
    ne_lat: float | None = Query(default=None),
    ne_lng: float | None = Query(default=None),
    center_lat: float | None = Query(default=None),
    center_lng: float | None = Query(default=None),
    radius_m: float | None = Query(default=None, gt=0),
    search_type: str | None = Query(default=None),
    geometry: str | None = Query(default=None),
    cuisine: list[str] | None = Query(default=None),
    cost: list[str] | None = Query(default=None),
    venue_type: str | None = Query(default=""),
    rank_column: str | None = Query(default=None),
    wilson_basis: int = Query(default=1, ge=0, le=2),
    score_basis: int = Query(default=0, ge=0, le=2),
    score_tier: int = Query(default=0, ge=0, le=4),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1)
) -> dict[str, Any]:
    """
    Fetch paginated list of places with optional circle filter and city context.
    """
    # Normalize filters: empty → '__all__' (no-filter marker), 'Unspecified' → '__null__' (sentinel)
    cuisine_values = normalize_dimension_list(cuisine)
    cost_values = normalize_dimension_list(cost)
    venue_value = normalize_dimension(venue_type)
    city_slug = city.lower().strip()
    geometry_search = parse_geometry_search(search_type, geometry, radius_m)
    
    rank_column_map = {
        "normal_0": "normal_0",
        "normal_1": "normal_1",
        "normal_2": "normal_2",
        "wilson_0": "wilson_0",
        "wilson_1": "wilson_1",
        "wilson_2": "wilson_2",
    }
    sort_column = rank_column_map.get(rank_column, get_wilson_basis_column(wilson_basis))
    # Always reference $13 in SQL — an unreferenced typed parameter makes Postgres
    # raise IndeterminateDatatypeError. tier_* >= 0 is a no-op (tiers are 0–4).
    tier_column = get_score_basis_column(score_basis)
    tier_filter = f"AND {tier_column} >= $13"
    offset = (page - 1) * page_size
    has_circle_filter = center_lat is not None and center_lng is not None and radius_m is not None

    if geometry_search is not None:
        sql = SQL_PLACES_LIST_GEOMETRY.format(
            sort_column=sort_column,
            tier_column=tier_column,
            spatial_predicate=build_geometry_predicate(geometry_search.search_type),
            page_size=page_size,
        )
        async with request.app.state.pool.acquire() as conn:
            rows = await conn.fetch(
                sql,
                city_slug,
                geometry_search.geometry_json,
                geometry_search.radius_m or 0.0,
                cuisine_values,
                venue_value,
                cost_values,
                score_tier,
                offset,
            )
        return {
            "page": page,
            "page_size": len(rows),
            "data": [dict(row) for row in rows],
        }

    if any(value is None for value in (sw_lat, sw_lng, ne_lat, ne_lng)):
        raise HTTPException(
            status_code=422,
            detail="sw_lat, sw_lng, ne_lat, ne_lng are required unless a geometry search is provided",
        )

    sql = SQL_PLACES_LIST.format(
        sort_column=sort_column,
        tier_filter=tier_filter,
        page_size=page_size
    )

    async with request.app.state.pool.acquire() as conn:
        rows = await conn.fetch(
            sql,
            city_slug,
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
