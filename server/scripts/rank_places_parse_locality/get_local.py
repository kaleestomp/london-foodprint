import numpy as np
import pandas as pd
from server.scripts.h3.h3_api import _h3_get_parent, _h3_get_resolution, _h3_latlng_to_cell

TYPE_COL   = "cuisineType"   # ← change to your actual cuisine/type column name
VENUE_COL  = "venueType"
UNSPECIFIED_TYPE = "Unspecified"
ALPHA      = 0.1             # competition boost strength (0 = off, 0.5 = strong)
Z_CONFIDENCE = 2.576
MIN_REPRESENTATIONS = 4      # minimum same-type count in region to apply any boost;
                             # below this there's no real competition to have beaten
# 95% — how conservative the credibility discount is
# Z_CONFIDENCE = 1.960 (95%) controls how aggressively sparse regions are discounted 
# — raise to 2.576 (99%) to be even more conservative.

def get_local_tile_id(row: pd.Series, res: int = 9) -> str:
    """Return the parent tile ID at the specified resolution for a given tile_id."""
    tile_id = row['tile_id']
    h3_res = _h3_get_resolution(tile_id)
    if h3_res < res:
        return _h3_latlng_to_cell(float(row['lat']), float(row['lon']), res)
    if h3_res > res:
        return _h3_get_parent(tile_id, res)
    else:
        return tile_id



def get_local_competition_factor(df_places: pd.DataFrame, global_composition: pd.DataFrame, local_tiles: set, local_tile: str = None) -> pd.DataFrame:

    local_places = df_places[df_places['local_tile'].isin(local_tiles)]
    if local_places.empty:
        return 

    # Exclude unspecified cuisine types from competition calculations.
    local_places = local_places[local_places[TYPE_COL].ne(UNSPECIFIED_TYPE)]
    if local_places.empty:
        return

    # Competition can be defined by cuisine only, or by cuisine+venueType when
    # venueType exists in both local data and global composition.
    group_cols = [TYPE_COL]
    if VENUE_COL in local_places.columns and VENUE_COL in global_composition.columns:
        group_cols.append(VENUE_COL)
    
    n_region = len(local_places)
    local_composition = (
        local_places.groupby(group_cols, dropna=False)
        .size()
        .rename("n_type")
        .reset_index()
    )
    local_composition["p_local"] = local_composition["n_type"] / n_region
    # Credible proportion: Wilson lower bound on p_local given n_region observations
    local_composition["p_credible"] = local_composition.apply(
        lambda r: _wilson_lower(r["p_local"], n_region, Z_CONFIDENCE), axis=1
    )
    merged = local_composition.merge(global_composition, on=group_cols, how="left")
    # competition_factor uses credible proportion — small regions auto-discounted.
    # If representations < MIN_REPRESENTATIONS, there's no real competition to have beaten
    # (e.g. the only Ukrainian restaurant in the area has no rivals — ρ is meaningless).
    # Force competition_factor = 1.0 (neutral) in that case.
    raw_factor = merged["p_credible"] / (merged["p_global"].fillna(1e-9))
    merged["competition_factor"] = np.where(
        merged["n_type"] >= MIN_REPRESENTATIONS,
        raw_factor,
        1.0
    )
    # local_tile is the centre tile of this region; local_tiles is the full neighbourhood set
    merged["local_tile"] = local_tile# if local_tile is not None else next(iter(local_tiles))
    merged["neighbour_count"] = n_region
    merged["representations"] = merged["n_type"]  # raw count
    
    return merged

def _wilson_lower(p_hat: float, n: int, z: float = Z_CONFIDENCE) -> float:
    if n == 0:
        return 0.0
    return (
        p_hat + z**2 / (2*n) - z * np.sqrt(p_hat*(1-p_hat)/n + z**2/(4*n**2))
    ) / (1 + z**2/n)