from collections import deque
import folium
import geopandas as gpd
import random
from h3_api import _h3_cell_to_shapely, _h3_cell_center, _h3_get_children
from config import SOURCE_CRS, H3_EDGE_LENGTH_M, MAX_DEPTH, SATURATION_THRESHOLD

# --- Mock Google Places API subdivision (H3 hex edition) ---
# Rules:
#   - 50% chance a tile returns 20 results (saturated) → subdivide into ~7 children
#   - 50% chance returns under 20 → accept tile as final
#   - Children fully outside Inner London boundary are discarded immediately

def mock_places_api() -> int:
    """50% chance of saturation (20), else uniform random 0–19."""
    if random.random() < 0.5:
        return SATURATION_THRESHOLD
    return random.randint(0, SATURATION_THRESHOLD - 1)

def run_h3_recursive_division(seed_geodf: gpd.GeoDataFrame, union_wgs84, api_func=mock_places_api) -> gpd.GeoDataFrame:
    """
    Simulate adaptive H3 subdivision driven by mock Places API results.

    Each saturated tile is split into ~7 children (H3 hierarchy).
    Children that don't intersect Inner London are dropped without an API call.
    """
    random.seed(42) # Random Seed
    queue = deque(seed_geodf.to_dict("records"))
    final_cells = []
    stats = {"api_calls": 0, "discarded": 0, "added": 0}
    
    while queue:
        row  = queue.popleft()
        geom = row["geometry"]

        # Boundary check — no API call for out-of-bounds cells.
        if not geom.intersects(union_wgs84):
            stats["discarded"] += 1
            continue

        # Mock API Call  
        result_count = api_func()
        stats["api_calls"] += 1
        row["result_count"] = result_count

        if result_count >= SATURATION_THRESHOLD and row["level"] < MAX_DEPTH:
            children = subdivide_h3_cell(row) # ~7 children per hex
            row["children"] += len(children)
            stats["added"] += len(children) 
            for child in children: queue.append(child)
        else:
            final_cells.append(row)
        row["checked"] = True

    gdf = gpd.GeoDataFrame(final_cells, geometry="geometry", crs=SOURCE_CRS)
    print(f"Mock run complete | Final Cell Count: {len(gdf)} | Stats: {stats}")

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
                # "root_tile_id": row["root_tile_id"],
                "tile_path_id": f"{row['tile_path_id']}-{child_index}",
                # "root_h3_id": row["root_h3_id"],
                # "root_center_lat": row["root_center_lat"],
                # "root_center_lon": row["root_center_lon"],
                "h3_res": child_res,
                "level": child_level,
                "center_lat": lat,
                "center_lon": lng,
                "tile_size_m": edge_m,
                "geometry": _h3_cell_to_shapely(child_id),
                "children": 0, 
                "checked": False, 
            }
        )
    return out

