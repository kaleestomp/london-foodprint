from datetime import date
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
    # Current DB’s convention: Sunday = 0, Monday = 1, ..., Saturday = 6.
    # Python’s weekday() is Monday-based, so convert only the query value;
    # stored opening-window data remains unchanged.
    open_day = (date.today().weekday() + 1) % 7
    sql = """
        SELECT
            places.city_slug,
            places.id,
            lat,
            lon,
            normal_1 AS ranking,
            display_name,
            cuisine_type,
            cost AS price,
            local_rep_ratio,
            local_total,
            rep_delta,
            pcd,
            chain_count,
            chain_name,
            is_chain,
            is_major_chain,
            venue_type,
            google_maps_uri,
            website_uri,
            short_formatted_address,
            user_rating_count AS review_count,
            CASE WHEN ow.open_minute IS NULL THEN NULL ELSE json_build_object(
                'open_minute', ow.open_minute,
                'close_minute', ow.close_minute
            ) END AS opening_time
        FROM places
        LEFT JOIN LATERAL (
            SELECT open_minute, close_minute
            FROM place_open_windows
            WHERE city_slug = places.city_slug
              AND place_id = places.id
              AND open_day = $3
            ORDER BY open_minute, close_minute
            LIMIT 1
        ) AS ow ON TRUE
                WHERE places.id = $1
                    AND ($2::TEXT IS NULL OR places.city_slug = $2)
    """

    async with request.app.state.pool.acquire() as conn:
        row = await conn.fetchrow(sql, place_id, city_slug, open_day)

    if row is None:
        raise HTTPException(status_code=404, detail="Place not found")

    return dict(row)
