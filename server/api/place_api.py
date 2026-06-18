from typing import Any

from fastapi import APIRouter, HTTPException, Request

router = APIRouter()


@router.get("/api/place/{place_id}")
async def get_place(place_id: str, request: Request) -> dict[str, Any]:
    sql = """
        SELECT
            id,
            normal_1 AS ranking,
            display_name,
            cuisine_type,
            is_chain,
            venue_type,
            google_maps_uri,
            website_uri,
            short_formatted_address,
            pcd
        FROM places
        WHERE id = $1
    """

    async with request.app.state.pool.acquire() as conn:
        row = await conn.fetchrow(sql, place_id)

    if row is None:
        raise HTTPException(status_code=404, detail="Place not found")

    return dict(row)
