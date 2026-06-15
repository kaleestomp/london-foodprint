from typing import Any

from fastapi import APIRouter, HTTPException, Request

router = APIRouter()


@router.get("/api/place/{place_id}")
async def get_place(place_id: str, request: Request) -> dict[str, Any]:
    sql = """
        SELECT
            id,
            display_name,
            primary_type_display_name,
            rating,
            user_rating_count,
            short_formatted_address,
            google_maps_uri,
            website_uri,
            types,
            primary_type,
            is_chain,
            predicted_type,
            cuisine_type,
            venue_type,
            lat,
            lon,
            h3_r10,
            pcd,
            areacode,
            wheelchair_access,
            operational,
            cost,
            wilson_1,
            normal_1,
            tier,
            tier_d,
            tier_independent
        FROM places
        WHERE id = $1
    """

    async with request.app.state.pool.acquire() as conn:
        row = await conn.fetchrow(sql, place_id)

    if row is None:
        raise HTTPException(status_code=404, detail="Place not found")

    return dict(row)
