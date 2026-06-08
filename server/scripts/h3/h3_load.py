from pathlib import Path
import geopandas as gpd
import pandas as pd
from shapely import wkt
from server.scripts.h3.config import BOUNDARY_JSON_PATH, SOURCE_CRS

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
    # gdf currently not used

    inner_union = gdf.unary_union
    return inner_union

def load_geodf_from_csv(csv_path: Path) -> gpd.GeoDataFrame:
    """
    Load a GeoDataFrame from CSV with WKT geometry.
    Expects 'geometry' column with WKT strings.
    """
    
    df = pd.read_csv(csv_path)
    if "geometry" not in df.columns:
        raise ValueError(f"{csv_path} missing 'geometry' column.")
    df["geometry"] = df["geometry"].apply(wkt.loads)
    geodf = gpd.GeoDataFrame(df, geometry="geometry", crs=SOURCE_CRS)

    return geodf
