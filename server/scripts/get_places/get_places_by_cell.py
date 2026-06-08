import asyncio
from collections import deque
import math
from pathlib import Path
import pandas as pd
import geopandas as gpd
from server.scripts.h3.config import SOURCE_CRS
from server.scripts.get_places.request_places.request_places import nearby_search
OUT = Path("../../out/places_cache")
DELAY = 1.25

async def get_places_by_cell(seed_geodf: gpd.GeoDataFrame, out_path: Path = OUT) -> gpd.GeoDataFrame:

    queue = deque(seed_geodf.to_dict("records"))
    final_cells = []
    stats = {"api_calls": 0, "places": 0, "api_failures": 0}
    out_path.mkdir(parents=True, exist_ok=True)
    
    while queue:
        row  = queue.popleft()
        try:
            places = await nearby_search(
                latitude = row["center_lat"],
                longitude = row["center_lon"],
                radius= float(row["tile_size_m"]),
            )
            places_df = pd.DataFrame(places)
            places_df.to_csv(out_path / f"{row['tile_path_id']}.csv", index=False)
            row["scrubbed"] = True
            row["places_count"] = len(places_df)
            stats["places"] += len(places_df)
        except Exception as exc:
            stats["api_failures"] += 1
            row["scrubbed"] = False
            row["places_count"] = 0
            pd.DataFrame([
                {
                    "error": type(exc).__name__,
                    "message": str(exc),
                    "tile_path_id": row.get("tile_path_id"),
                    "center_lat": row.get("center_lat"),
                    "center_lon": row.get("center_lon"),
                    "radius_m": row.get("tile_size_m"),
                }
            ]).to_csv(out_path / f"{row['tile_path_id']}[error].csv", index=False)

        stats["api_calls"] += 1
        final_cells.append(row)
        print(f"API calls executed for {row['tile_path_id']}: {stats['api_calls']} | failures: {stats['api_failures']} | places: {stats['places']}", flush=True)
        await asyncio.sleep(DELAY)

    gdf = gpd.GeoDataFrame(final_cells, geometry="geometry", crs=SOURCE_CRS)
    print(f"Run complete | Stats: {stats} | Places per Call: {stats['places']/stats['api_calls'] if stats['api_calls'] > 0 else 0}")

    return gdf
