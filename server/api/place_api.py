from typing import Any

from fastapi import APIRouter, HTTPException, Request

router = APIRouter()


@router.get("/api/place/{place_id}")
async def get_place(place_id: str, request: Request) -> dict[str, Any]:
    sql = """
        SELECT
            id,
            display_name,
            lat,
            lon,
            cuisine_type,
            venue_type,
            cost,
            is_chain,
            primary_type,
            type_label,
            rating,
            user_rating_count,
            score_0,
            rank_0,
            score_1,
            rank_1,
            score_2,
            rank_2,
            wscore_0,
            wrank_0,
            wscore_1,
            wrank_1,
            wscore_2,
            wrank_2,
            operational,
            address,
            postcode,
            area_code,
            google_maps_uri,
            website_uri,
            wheelchair_access
        FROM places
        WHERE id = $1
    """

    async with request.app.state.pool.acquire() as conn:
        row = await conn.fetchrow(sql, place_id)

    if row is None:
        raise HTTPException(status_code=404, detail="Place not found")

    return dict(row)
