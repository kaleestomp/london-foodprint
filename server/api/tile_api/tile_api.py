from typing import Any

import h3
from fastapi import APIRouter, HTTPException, Query, Request
from api.cache_keys import build_endpoint_cache_key
from api.tile_api.tile_cache import (
    _run_singleflight,
)
from api.tile_api.sql import PLACES_SQL, TILES_SQL, SINGLETON_SQL
from api.sql_util.normalize import normalize_dimension, normalize_dimension_list, get_score_basis_column
from api.map_util.map_util import PAGE_SIZE_ON_ZOOM, PAGE_SIZE_ON_ZOOM_INCREASED, PAGE_SIZE_ON_REQUEST, h3_cells_for_bbox

def _expand_to_lookup_cells(tiles: list[str], resolution: int) -> tuple[list[str], dict[str, str]]:
    """
    Resolve a list of H3 tiles to the corresponding place lookup cell IDs.
    Returns:
      lookup_cells - flat list of lookup cell IDs to query against the places table
      reverse      - maps each lookup cell back to its parent singleton tile ID

    - resolution <= 10: use h3_r10 lookup cells.
      - resolution == 10: already at the target resolution; use the tile itself.
      - resolution < 10: tile is coarser than res-10, so expand to its res-10 descendants.
    - resolution >= 11: use h3_r11 lookup cells.
      - resolution == 11: already at the target resolution; use the tile itself.
      - resolution > 11: tile is finer than res-11, so collapse to its res-11 parent.
    """
    if resolution == 10 or resolution == 11:
        return tiles, {t: t for t in tiles}

    lookup_cells: list[str] = []
    reverse: dict[str, str] = {}
    if resolution < 10:
        for tile in tiles:
            children = list(h3.cell_to_children(tile, 10))
            lookup_cells.extend(children)
            for child in children:
                reverse[child] = tile
    else:
        for tile in tiles:
            parent = h3.cell_to_parent(tile, 11)
            if parent:
                lookup_cells.append(parent)
                reverse[parent] = tile
    return lookup_cells, reverse


router = APIRouter()

@router.get("/api/tiles")
async def get_tiles(
    request: Request,
    sw_lat: float = Query(...),
    sw_lng: float = Query(...),
    ne_lat: float = Query(...),
    ne_lng: float = Query(...),
    res: int = Query(..., ge=7, le=16),
    cuisine: list[str] | None = Query(default=None),
    cost: list[str] | None = Query(default=None),
    venue_type: str | None = Query(default=""),
    score_basis: int = Query(default=0, ge=0, le=2),
    score_tier: int = Query(default=0, ge=0, le=4),
    places_only: bool = Query(default=False),
) -> dict[str, Any]:
    
    # VALIDATE INPUTS
    if places_only and res < 12:
        raise HTTPException(status_code=422, detail="places_only requires res=12")

    # Normalize filters: empty → '__all__' (no-filter marker), 'Unspecified' → '__null__' (sentinel)
    cuisine_values = normalize_dimension_list(cuisine)
    cost_values = normalize_dimension_list(cost)
    venue_value = normalize_dimension(venue_type)
    resolution = res
    tier_column = get_score_basis_column(score_basis)
    outer_tiles, inner_tiles = h3_cells_for_bbox(sw_lat, sw_lng, ne_lat, ne_lng, resolution)

    # Singleflight key uses snapped outer tiles so concurrent identical
    # requests share one in-flight DB query without persistent response caching.
    tiles_singleflight_key = build_endpoint_cache_key(
        endpoint="tiles",
        scope="tiles_outer_snapped",
        resolution=resolution,
        cuisine_values=cuisine_values,
        cost_values=cost_values,
        venue_value=venue_value,
        score_basis=score_basis,
        score_tier=score_tier,
        snapped_tiles=outer_tiles,
        parts=[],
    )

    # --- places_only fast-path: skip density query entirely ---
    if places_only:
        async with request.app.state.pool.acquire() as conn:
            rows = await conn.fetch(
                PLACES_SQL.format(rank_column=tier_column, page_size=PAGE_SIZE_ON_REQUEST),
                sw_lat, ne_lat, sw_lng, ne_lng,
                cuisine_values, venue_value, cost_values,
                score_tier,
            )
        return {
            "mode": "places",
            "data": [dict(row) for row in rows],
            "total": len(rows),
        }
    # ----------------------------------------------------------

    # --- default: tile query first (no persistent cache) ---
    # Coalesce concurrent misses by snapped tile key to avoid duplicate DB work.
    async def produce_tile_rows() -> Any:
        async with request.app.state.pool.acquire() as conn:
            # ⚠️  score_basis has TWO meanings:
            # 1. Selects ranking column (tier/tier_d/tier_independent) for places queries
            # 2. Filters h3_density by score_basis int value (0, 1, or 2)
            # The h3_density table pre-aggregates counts per (score_basis, ...) so we filter by the int.
            return await conn.fetch(
                TILES_SQL,
                resolution,
                outer_tiles,
                cuisine_values,
                cost_values,
                venue_value,
                score_basis,
                score_tier,
            )

    tile_rows = await _run_singleflight(f"tile_rows|{tiles_singleflight_key}", produce_tile_rows)

    # Use only the inner (unpadded) tiles to decide whether to fall back to
    # the places query — avoids counting edge tiles that are barely visible.
    inner_set = set(inner_tiles)
    inner_count = sum(int(row["count"]) for row in tile_rows if row["tile"] in inner_set)

    threshold = PAGE_SIZE_ON_ZOOM_INCREASED if resolution >= 10 else PAGE_SIZE_ON_ZOOM
    if inner_count <= threshold:
        async with request.app.state.pool.acquire() as fallback_conn:
            fallback_rows = await fallback_conn.fetch(
                PLACES_SQL.format(rank_column=tier_column, page_size=int(threshold*1.5)),
                sw_lat,
                ne_lat,
                sw_lng,
                ne_lng,
                cuisine_values,
                venue_value,
                cost_values,
                score_tier,
            )
        # Note: Use actual len(rows) as total, not inner_count.
        # H3 tiles don't perfectly align with lat/lon bboxes, so a place inside an
        # inner tile may fall outside the exact bbox bounds. inner_count is a heuristic
        # for switching modes; the true count is what the places query returns.
        return {
            "mode": "places",
            "data": [dict(row) for row in fallback_rows],
            "total": len(fallback_rows),
        }

    # Enrich singleton tiles (count=1) with the actual place lat/lon.
    # For res <= 10 we use h3_r10; for res >= 11 we use h3_r11 so the lookup
    # matches the identifier stored on each place.
    singleton_tiles = [row["tile"] for row in tile_rows if int(row["count"]) == 1]
    singleton_map: dict[str, dict] = {}
    if singleton_tiles:
        lookup_column = "h3_r11" if resolution >= 11 else "h3_r10"
        lookup_cells, lookup_to_tile = _expand_to_lookup_cells(singleton_tiles, resolution)
        async with request.app.state.pool.acquire() as conn:
            s_rows = await conn.fetch(
                SINGLETON_SQL.format(rank_column=tier_column, lookup_column=lookup_column),
                lookup_cells,
                cuisine_values,
                venue_value,
                cost_values,
                score_tier,
            )
        for s in s_rows:
            parent_tile = lookup_to_tile.get(s["tile"])
            if parent_tile and parent_tile not in singleton_map:
                singleton_map[parent_tile] = {
                    "id":  s["id"],
                    "lat": s["lat"],
                    "lon": s["lon"],
                    "tier": s["tier"],
                }

    tile_data = []
    for row in tile_rows:
        entry = dict(row)
        if int(entry["count"]) == 1:
            entry["singleton"] = singleton_map.get(entry["tile"])
        tile_data.append(entry)

    payload = {
        "mode": "tiles",
        "resolution": resolution,
        "data": tile_data,
    }
    return payload
