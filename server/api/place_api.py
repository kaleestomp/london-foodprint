from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request

router = APIRouter()


@router.get("/api/place/{place_id}")
async def get_place(
    place_id: str,
    request: Request,
    city: str | None = Query(default=None),
) -> dict[str, Any]:
    city_slug = city.lower().strip() if city else None
    sql = """
        SELECT
            city_slug,
            id,
            lat,
            lon,
            normal_1 AS ranking,
            display_name,
            cuisine_type,
            cost AS price,
            is_chain,
            is_major_chain,
            venue_type,
            google_maps_uri,
            website_uri,
            short_formatted_address,
            pcd
        FROM places
        WHERE id = $1
          AND ($2::TEXT IS NULL OR city_slug = $2)
    """

    async with request.app.state.pool.acquire() as conn:
        row = await conn.fetchrow(sql, place_id, city_slug)

    if row is None:
        raise HTTPException(status_code=404, detail="Place not found")

    return dict(row)
