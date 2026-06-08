import asyncio
from collections import deque
from pathlib import Path
import pandas as pd
import geopandas as gpd
import random
import math
from server.scripts.h3.h3_api import _h3_cell_to_shapely, _h3_cell_center, _h3_get_children
from server.scripts.h3.config import SOURCE_CRS, H3_EDGE_LENGTH_M, MAX_DEPTH, SATURATION_THRESHOLD, DELAY
from server.scripts.get_seed_map_level2.request_aggregate.request_aggregate import request_aggregate
OUT = Path("../../out/aggregate_cache")
ERROR_OUT = OUT / "error"

# --- Mock Places Aggregate API subdivision (H3 hex edition) ---
def mock_request_aggregate() -> int:
    # Rules:
    #   - 50% chance a tile returns 20 results (saturated) → subdivide into ~7 children
    #   - 50% chance returns under 20 → accept tile as final
    #   - Children fully outside Inner London boundary are discarded immediately
    """50% chance of saturation (20), else uniform random 0–19."""
    if random.random() < 0.5:
        return SATURATION_THRESHOLD
    return random.randint(0, SATURATION_THRESHOLD - 1)

async def run_h3_recursive_division(seed_geodf: gpd.GeoDataFrame, union_wgs84, disable_api: bool=True) -> gpd.GeoDataFrame:
    """
    Simulate adaptive H3 subdivision driven by Places Aggregate counts.

    Each tile gets an aggregate count; saturated tiles are split into ~7 children.
    Children that don't intersect Inner London are dropped without an API call.
    """
    random.seed(42) # Random Seed
    queue = deque(seed_geodf.to_dict("records"))
    final_cells = []
    stats = {"api_calls": 0, "discarded": 0, "added": 0, "api_failures": 0}
    OUT.mkdir(parents=True, exist_ok=True)
    ERROR_OUT.mkdir(parents=True, exist_ok=True)
    
    while queue:
        row  = queue.popleft()
        geom = row["geometry"]
        row.setdefault("fetch_success", None)

        # Boundary check — no API call for out-of-bounds cells.
        if not geom.intersects(union_wgs84):
            stats["discarded"] += 1
            continue

        if disable_api: # Mock Aggregate API Call
            result_count = mock_request_aggregate()
            row["fetch_success"] = True
        else:           # Real Aggregate API call
            try:
                result_count = await request_aggregate(
                    latitude = row["center_lat"],
                    longitude = row["center_lon"],
                    radius= int(math.ceil(row["tile_size_m"])),
                    cache = False
                )
                pd.DataFrame([
                    {
                        "tile_id": row.get("tile_id"),
                        "tile_path_id": row.get("tile_path_id"),
                        "seed_index": row.get("seed_index"),
                        "h3_res": row.get("h3_res"),
                        "level": row.get("level"),
                        "center_lat": row.get("center_lat"),
                        "center_lon": row.get("center_lon"),
                        "radius_m": row.get("tile_size_m"),
                        "result_count": result_count,
                    }
                ]).to_csv(OUT / f"{row['tile_path_id']}.csv", index=False)
                row["fetch_success"] = True

            except Exception as exc:
                stats["api_failures"] += 1
                row["fetch_success"] = False
                row["result_count"] = None
                row["checked"] = True
                pd.DataFrame([
                    {
                        "error": type(exc).__name__,
                        "message": str(exc),
                        "tile_path_id": row.get("tile_path_id"),
                        "center_lat": row.get("center_lat"),
                        "center_lon": row.get("center_lon"),
                        "radius_m": row.get("tile_size_m"),
                    }
                ]).to_csv(ERROR_OUT / f"{row['tile_path_id']}.csv", index=False)
                final_cells.append(row)
                stats["api_calls"] += 1
                print(f"API calls executed for {row['tile_path_id']}: {stats['api_calls']} | failures: {stats['api_failures']}", flush=True)
                await asyncio.sleep(2.25)
                continue
            await asyncio.sleep(DELAY) # Rate limit

        stats["api_calls"] += 1
        print(f"API calls executed for {row['tile_path_id']}: {stats['api_calls']} | failures: {stats['api_failures']}", flush=True)
        row["result_count"] = result_count

        # Subdivision Rule
        if result_count >= SATURATION_THRESHOLD and row["level"] < MAX_DEPTH:
            children = subdivide_h3_cell(row) # ~7 children per hex
            row["children"] += len(children)
            stats["added"] += len(children) 
            for child in children: queue.append(child)

        final_cells.append(row)
        row["checked"] = True

    gdf = gpd.GeoDataFrame(final_cells, geometry="geometry", crs=SOURCE_CRS)
    print(f"Run complete | Final Cell Count: {len(gdf)} | Stats: {stats}")

    return gdf

def subdivide_h3_cell(row: dict) -> list:
    """
    Split one H3 cell into its ~7 children at the next resolution.
    Each hexagon produces exactly 7 children in H3's hierarchy.

    Child index is deterministic: children are sorted by H3 ID and then indexed 0..6.
    This index is appended to tile_path_id, e.g. 12-4-1.
    """
    child_res = int(row["h3_res"]) + 1
    child_level = int(row["level"]) + 1
    edge_m = H3_EDGE_LENGTH_M.get(child_res, 0)

    children = sorted(_h3_get_children(row["tile_id"], child_res))
    out = []
    for child_index, child_id in enumerate(children):
        lat, lng = _h3_cell_center(child_id)
        out.append(
            {
                "tile_id": child_id,
                "tile_path_id": f"{row['tile_path_id']}-{child_index}",
                "seed_index": row["seed_index"],
                "h3_res": child_res,
                "level": child_level,
                "center_lat": lat,
                "center_lon": lng,
                "tile_size_m": edge_m,
                "geometry": _h3_cell_to_shapely(child_id),

                "children": 0, 
                "checked": False, 
                "fetch_success": None, 
            }
        )
    return out

