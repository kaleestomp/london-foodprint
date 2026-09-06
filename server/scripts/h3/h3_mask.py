from pathlib import Path
import geopandas as gpd
from server.scripts.h3.h3_load import load_geodf_from_csv

def h3_mask(geodf: gpd.GeoDataFrame, mask_path: Path = None):

    if mask_path is not None and mask_path.exists():
        mask_geodf = load_geodf_from_csv(mask_path)
        highest_id = mask_geodf['seed_index'].max()

        geodf = geodf[~geodf.tile_id.isin(mask_geodf.tile_id)]
        geodf.reset_index(drop=True, inplace=True)
        geodf['seed_index'] = geodf.index + highest_id
        geodf['tile_path_id'] = geodf['seed_index'].astype(str)
    
    return geodf