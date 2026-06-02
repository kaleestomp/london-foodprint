from pathlib import Path
import geopandas as gpd
from config import BOUNDARY_JSON_PATH, SOURCE_CRS

# --- Load JSON ----
def load_boundary_from_json(json_path: Path=BOUNDARY_JSON_PATH):
    """
    Load preformatted Inner London boundary from GeoJSON.
    Expects a FeatureCollection with one boundary feature.
    """
    gdf = gpd.read_file(json_path)
    if gdf.empty: raise ValueError("inner_london_boundary.json has no features.")

    # Ensure WGS84 for H3 operations.
    if gdf.crs is None:
        gdf = gdf.set_crs(SOURCE_CRS)
    elif str(gdf.crs) != SOURCE_CRS:
        gdf = gdf.to_crs(SOURCE_CRS)

    inner_union = gdf.unary_union
    return gdf, inner_union

