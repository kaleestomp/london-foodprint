import geopandas as gpd
from server.scripts.adaptive_hexsearch.h3.h3_seedtiles import get_distance


def select_tiles_in_radius(
    seed_gdf: gpd.GeoDataFrame,
    lat: float,
    lon: float,
    radius_m: float,
) -> gpd.GeoDataFrame:
    """
    Return the subset of seed tiles whose centroid falls within `radius_m` metres
    of the given (lat, lon) coordinate.

    Parameters
    ----------
    seed_gdf  : GeoDataFrame produced by get_seed_cells()
    lat, lon  : Centre of the selection circle (WGS84 degrees)
    radius_m  : Radius in metres

    Returns
    -------
    Filtered GeoDataFrame (same schema, preserves original index).
    """
    mask = seed_gdf.apply(
        lambda row: get_distance(lat, lon, row["center_lat"], row["center_lon"]) <= radius_m,
        axis=1,
    )
    return seed_gdf[mask].copy()
