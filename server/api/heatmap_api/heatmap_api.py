from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request

from api.sql_util.normalize import (
    get_score_basis_column,
    normalize_dimension,
    normalize_dimension_list,
)

router = APIRouter()


@router.get("/api/heatmap")
async def get_heatmap_coordinates(
    request: Request,
    sw_lat: float | None = Query(default=None),
    sw_lng: float | None = Query(default=None),
    ne_lat: float | None = Query(default=None),
    ne_lng: float | None = Query(default=None),
    cuisine: list[str] | None = Query(default=None),
    cost: list[str] | None = Query(default=None),
    venue_type: str | None = Query(default=""),
    score_basis: int = Query(default=0, ge=0, le=2),
    score_tier: int = Query(default=0, ge=0, le=4),
) -> dict[str, Any]:
    """Return coordinates for all places matching the supplied filters."""
    cuisine_values = normalize_dimension_list(cuisine)
    cost_values = normalize_dimension_list(cost)
    venue_value = normalize_dimension(venue_type)
    rank_column = get_score_basis_column(score_basis)

    bbox_values = (sw_lat, sw_lng, ne_lat, ne_lng)
    has_bbox = all(value is not None for value in bbox_values)
    if any(value is not None for value in bbox_values) and not has_bbox:
        raise HTTPException(
            status_code=400,
            detail="Provide all four bbox parameters: sw_lat, sw_lng, ne_lat, ne_lng.",
        )

    bbox_sql = ""
    bbox_params: tuple[float, float, float, float] = (0.0, 0.0, 0.0, 0.0)
    if has_bbox:
        bbox_sql = "AND lat BETWEEN $1 AND $2 AND lon BETWEEN $3 AND $4"
        assert sw_lat is not None and sw_lng is not None
        assert ne_lat is not None and ne_lng is not None
        bbox_params = (sw_lat, ne_lat, sw_lng, ne_lng)

    offset = 4 if has_bbox else 0
    cuisine_param = offset + 1
    venue_param = offset + 2
    cost_param = offset + 3
    tier_param = offset + 4

    sql = f"""
        SELECT id, lat, lon
        FROM places
        WHERE TRUE
          {bbox_sql}
          AND (
                CARDINALITY(${cuisine_param}::TEXT[]) = 0
                OR (
                    cuisine_type = ANY(ARRAY_REMOVE(${cuisine_param}::TEXT[], '__null__'))
                    OR ('__null__' = ANY(${cuisine_param}::TEXT[]) AND cuisine_type IS NULL)
                )
              )
          AND (
                ${venue_param} = '__all__'
                OR (${venue_param} = '__null__' AND venue_type IS NULL)
                OR (${venue_param} != '__all__' AND ${venue_param} != '__null__' AND venue_type = ${venue_param})
              )
          AND (
                CARDINALITY(${cost_param}::TEXT[]) = 0
                OR (
                    cost = ANY(ARRAY_REMOVE(${cost_param}::TEXT[], '__null__'))
                    OR ('__null__' = ANY(${cost_param}::TEXT[]) AND cost IS NULL)
                )
              )
          AND {rank_column} >= ${tier_param}
    """

    params: tuple[Any, ...] = (
        *bbox_params[:offset],
        cuisine_values,
        venue_value,
        cost_values,
        score_tier,
    )
    async with request.app.state.pool.acquire() as conn:
        rows = await conn.fetch(sql, *params)

    return {
        "data": [
            {"id": row["id"], "lat": row["lat"], "lng": row["lon"]}
            for row in rows
        ],
        "total": len(rows),
    }
