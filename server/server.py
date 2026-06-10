import math
import os
from contextlib import asynccontextmanager
from typing import Any

import asyncpg
import h3
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

RANK_THRESHOLD_MAP = {
    0: 0.0,
    2: 0.5,
    3: 0.75,
    4: 0.9,
}

PAGE_SIZE = 20


def zoom_to_resolution(zoom: int) -> int:
    if zoom <= 10:
        return 7
    if zoom <= 13:
        return 8
    if zoom <= 16:
        return 9
    return 10


def normalize_dimension(value: str | None) -> str:
    if value is None:
        return ""
    return value.strip()


def get_rank_column(score_basis: int) -> str:
    return "wrank_1" if score_basis == 1 else "rank_1"


def h3_cells_for_bbox(sw_lat: float, sw_lng: float, ne_lat: float, ne_lng: float, resolution: int) -> list[str]:
    if sw_lat >= ne_lat or sw_lng >= ne_lng:
        raise HTTPException(status_code=422, detail="Invalid bounding box")

    polygon = {
        "type": "Polygon",
        "coordinates": [[
            [sw_lng, sw_lat],
            [ne_lng, sw_lat],
            [ne_lng, ne_lat],
            [sw_lng, ne_lat],
            [sw_lng, sw_lat],
        ]],
    }

    try:
        cells = h3.geo_to_cells(polygon, resolution)
    except AttributeError:
        cells = h3.polygon_to_cells(polygon, resolution)

    if not cells:
        center_lat = (sw_lat + ne_lat) / 2
        center_lng = (sw_lng + ne_lng) / 2
        return [h3.latlng_to_cell(center_lat, center_lng, resolution)]

    return [str(cell) for cell in cells]


@asynccontextmanager
async def lifespan(app: FastAPI):
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required")

    app.state.pool = await asyncpg.create_pool(
        dsn=database_url,
        min_size=int(os.getenv("DB_POOL_MIN_SIZE", "1")),
        max_size=int(os.getenv("DB_POOL_MAX_SIZE", "5")),
        command_timeout=30,
    )
    yield
    await app.state.pool.close()


app = FastAPI(title="London Explorer API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/tiles")
async def get_tiles(
    sw_lat: float = Query(...),
    sw_lng: float = Query(...),
    ne_lat: float = Query(...),
    ne_lng: float = Query(...),
    zoom: int = Query(..., ge=0, le=22),
    cuisine: str | None = Query(default=""),
    cost: str | None = Query(default=""),
    venue_type: str | None = Query(default=""),
    score_basis: int = Query(default=0, ge=0, le=1),
    confidence: int = Query(default=1, ge=0, le=2),
    score_tier: int = Query(default=0),
) -> dict[str, Any]:
    if score_tier not in RANK_THRESHOLD_MAP:
        raise HTTPException(status_code=422, detail="score_tier must be one of 0,2,3,4")

    cuisine_value = normalize_dimension(cuisine)
    cost_value = normalize_dimension(cost)
    venue_value = normalize_dimension(venue_type)
    resolution = zoom_to_resolution(zoom)
    rank_column = get_rank_column(score_basis)
    rank_threshold = RANK_THRESHOLD_MAP[score_tier]

    count_sql = f"""
        SELECT COUNT(*)::INT AS total
        FROM places
        WHERE lat BETWEEN $1 AND $2
          AND lon BETWEEN $3 AND $4
          AND ($5 = '' OR cuisine_type = $5)
          AND ($6 = '' OR cost = $6)
          AND ($7 = '' OR venue_type = $7)
          AND {rank_column} >= $8
    """

    places_sql = f"""
        SELECT
            id,
            display_name,
            lat,
            lon,
            cuisine_type,
            venue_type,
            cost,
            rating,
            user_rating_count,
            operational,
            {rank_column} AS rank
        FROM places
        WHERE lat BETWEEN $1 AND $2
          AND lon BETWEEN $3 AND $4
          AND ($5 = '' OR cuisine_type = $5)
          AND ($6 = '' OR cost = $6)
          AND ($7 = '' OR venue_type = $7)
          AND {rank_column} >= $8
        ORDER BY {rank_column} DESC
        LIMIT {PAGE_SIZE}
    """

    async with app.state.pool.acquire() as conn:
        total = await conn.fetchval(
            count_sql,
            sw_lat,
            ne_lat,
            sw_lng,
            ne_lng,
            cuisine_value,
            cost_value,
            venue_value,
            rank_threshold,
        )

        if total <= PAGE_SIZE:
            rows = await conn.fetch(
                places_sql,
                sw_lat,
                ne_lat,
                sw_lng,
                ne_lng,
                cuisine_value,
                cost_value,
                venue_value,
                rank_threshold,
            )
            return {
                "mode": "places",
                "data": [dict(row) for row in rows],
                "total": total,
            }

        tiles = h3_cells_for_bbox(sw_lat, sw_lng, ne_lat, ne_lng, resolution)

        tiles_sql = """
            SELECT tile, count
            FROM h3_density
            WHERE resolution = $1
              AND tile = ANY($2::TEXT[])
              AND cuisine_type = $3
              AND cost = $4
              AND venue_type = $5
              AND score_basis = $6
              AND confidence = $7
              AND score_tier = $8
        """
        rows = await conn.fetch(
            tiles_sql,
            resolution,
            tiles,
            cuisine_value,
            cost_value,
            venue_value,
            score_basis,
            confidence,
            score_tier,
        )

    return {
        "mode": "tiles",
        "resolution": resolution,
        "data": [dict(row) for row in rows],
    }


@app.get("/api/nearby")
async def get_nearby(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_m: float = Query(default=1000, gt=0, le=10000),
    cuisine: str | None = Query(default=""),
    cost: str | None = Query(default=""),
    venue_type: str | None = Query(default=""),
    score_basis: int = Query(default=0, ge=0, le=1),
    confidence: int = Query(default=1, ge=0, le=2),
    rank_threshold: float = Query(default=0.0, ge=0.0, le=1.0),
    page: int = Query(default=1, ge=1),
) -> dict[str, Any]:
    del confidence

    cuisine_value = normalize_dimension(cuisine)
    cost_value = normalize_dimension(cost)
    venue_value = normalize_dimension(venue_type)
    rank_column = get_rank_column(score_basis)
    center_r10 = h3.latlng_to_cell(lat, lng, 10)
    k = math.ceil(radius_m / 114.2) + 1
    ring_cells = [str(cell) for cell in h3.grid_disk(center_r10, k)]
    offset = (page - 1) * PAGE_SIZE

    sql = f"""
        SELECT
            id,
            display_name,
            lat,
            lon,
            cuisine_type,
            venue_type,
            cost,
            rating,
            user_rating_count,
            operational,
            {rank_column} AS rank
        FROM places
        WHERE h3_r10 = ANY($1::TEXT[])
          AND ST_DWithin(
              geom::geography,
              ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
              $4
          )
          AND ($5 = '' OR cuisine_type = $5)
          AND ($6 = '' OR cost = $6)
          AND ($7 = '' OR venue_type = $7)
          AND {rank_column} >= $8
        ORDER BY {rank_column} DESC
        LIMIT {PAGE_SIZE}
        OFFSET $9
    """

    async with app.state.pool.acquire() as conn:
        rows = await conn.fetch(
            sql,
            ring_cells,
            lng,
            lat,
            radius_m,
            cuisine_value,
            cost_value,
            venue_value,
            rank_threshold,
            offset,
        )

    return {
        "page": page,
        "page_size": PAGE_SIZE,
        "data": [dict(row) for row in rows],
    }


@app.get("/api/place/{place_id}")
async def get_place(place_id: str) -> dict[str, Any]:
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

    async with app.state.pool.acquire() as conn:
        row = await conn.fetchrow(sql, place_id)

    if row is None:
        raise HTTPException(status_code=404, detail="Place not found")

    return dict(row)


@app.get("/health")
async def healthcheck() -> dict[str, str]:
    async with app.state.pool.acquire() as conn:
        await conn.fetchval("SELECT 1")
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "3000"))
    uvicorn.run("server.server:app", host="0.0.0.0", port=port, reload=False)
