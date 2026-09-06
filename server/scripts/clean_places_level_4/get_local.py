import pandas as pd

def get_local_representation_ratio(
    df_places: pd.DataFrame,
    local_tiles: set,
    local_tile: str = None,
) -> pd.DataFrame:
    """Return each cuisine and venue type's share of resolved local places."""
    local_places = df_places[df_places['local_tile'].isin(local_tiles)]
    local_places = local_places[local_places["cuisineType"].ne("Unspecified")]
    if local_places.empty:
        return pd.DataFrame(columns=[
            "cuisineType", "venueType", "local_rep_count", "local_rep_ratio", "local_total", "local_tile"
        ])

    n_region = len(local_places)
    local_composition = (local_places.groupby(["cuisineType", "venueType"], dropna=False)
        .size().rename("local_rep_count").reset_index()
    )
    local_composition["local_rep_ratio"] = local_composition["local_rep_count"] / n_region
    local_composition["local_rep_count"] = local_composition["local_rep_count"].astype(int)
    local_composition["local_total"] = int(n_region)
    local_composition["local_tile"] = local_tile

    local_composition['local_total'] = local_composition['local_total'].astype(int)

    return local_composition
