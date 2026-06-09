import geopandas as gpd
from server.scripts.h3.h3_api import _h3_get_children, _h3_cell_to_shapely, _h3_cell_center, _h3_latlng_to_cell, _h3_get_neighbours, _h3_get_parent, _h3_get_resolution
from server.scripts.h3.config import SOURCE_CRS

def expand_to_children(parent_df: gpd.GeoDataFrame, child_res: int) -> gpd.GeoDataFrame:
    """
    Expand each H3 cell in parent_df into its ~7 children at child_res.
    Children are sorted by H3 ID so child_index 0..6 is deterministic.
    tile_path_id is extended: "{parent_tile_path_id}-{child_index}"
    seed_index is inherited from the parent.
    """
    rows = []
    for _, row in parent_df.iterrows():
        children = sorted(_h3_get_children(row["tile_id"], child_res))
        for child_index, child_id in enumerate(children):
            lat, lng = _h3_cell_center(child_id)
            rows.append({
                "tile_id": child_id,
                "seed_index": row["seed_index"],
                "tile_path_id": f"{row['tile_path_id']}-{child_index}",
                "center_lat": lat,
                "center_lon": lng,
                "geometry": _h3_cell_to_shapely(child_id),
            })
    return gpd.GeoDataFrame(rows, geometry="geometry", crs=SOURCE_CRS)

def get_cell_for_point(df: gpd.GeoDataFrame, lat: float, lon: float) -> gpd.GeoSeries | None:
    """
    Return the row in df whose tile_id matches the H3 cell containing (lat, lon).
    df must be a GeoDataFrame produced by expand_to_children (or load_geodf_from_csv)
    so that it has a 'tile_id' column and a known h3_res — or, if h3_res is absent,
    the resolution is inferred from the tile_id itself.
    Returns a single-row GeoDataFrame, or None if not found.
    """
    # Infer resolution from the first tile_id if h3_res column is absent.
    if "h3_res" in df.columns:
        res = int(df["h3_res"].iloc[0])
    else:
        import h3 as _h3
        res = _h3.get_resolution(df["tile_id"].iloc[0])

    cell_id = _h3_latlng_to_cell(lat, lon, res)
    match = df[df["tile_id"] == cell_id]
    return match if not match.empty else None

def get_neighbours(df: gpd.GeoDataFrame, cell_id: str, k: int = 1) -> gpd.GeoDataFrame:
    """
    Return the rows in df within k rings of cell_id.
    k=1 -> up to 6 neighbours, k=2 -> up to 18, etc.
    Only cells that exist in df are returned.
    """
    neighbour_ids = _h3_get_neighbours(cell_id, k)
    return df[df["tile_id"].isin(neighbour_ids)]

def get_parent_cell_id(cell_id: str, parent_res: int | None = None) -> str:
    """
    Return the parent cell ID for a given H3 cell.
    If parent_res is None, returns the immediate parent (resolution - 1).
    """
    if parent_res is None:
        parent_res = _h3_get_resolution(cell_id) - 1
    return _h3_get_parent(cell_id, parent_res)