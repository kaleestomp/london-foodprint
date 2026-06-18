"""
build_h3_density.py
-------------------
Builds the h3_density pre-aggregation DataFrame from a places DataFrame.
Pure data transform — no file I/O, no DB calls.

Input columns required:
    h3_r10, cuisine_type, cost, venue_type
    tier, tier_d, tier_independent  (pre-computed tier assignments)

Output columns:
    tile, resolution, cuisine_type, cost, venue_type,
    score_basis, score_tier, count

Score tier semantics (CUMULATIVE thresholds — matches the frontend filter):
    0 = all                            (input tier >= 0)
    1 = above average                  (input tier >= 1)
    2 = strong                         (input tier >= 2)
    3 = top 10%                        (input tier >= 3)
    4 = top 5%                         (input tier >= 4)

score_basis:
    0 = tier       (base quality ranking)
    1 = tier_d     (diversity-aware: cuisine-capped representation)
    2 = tier_independent (diversity + no chains in top tiers)
"""
import itertools

import h3
import pandas as pd

H3_RESOLUTIONS = [7, 8, 9, 10]

# Maps score_basis to input tier column name
TIER_COLS = {
    0: "tier",
    1: "tier_d",
    2: "tier_independent",
}

# Maps output score_tier to a filter function on input tier values
TIER_FILTERS = {
    0: lambda t: t >= 0,   # all rows
    1: lambda t: t >= 1,   # above average
    2: lambda t: t >= 2,   # strong
    3: lambda t: t >= 3,   # top 10%
    4: lambda t: t >= 4,   # top 5%
}


def build_h3_density(df: pd.DataFrame) -> pd.DataFrame:
    """
    Pre-aggregate restaurant counts across all filter dimension combinations.
    Only non-zero count rows are returned.
    """
    # Pre-compute parent tile IDs at coarser resolutions from the res-10 base
    for res in [7, 8, 9]:
        df[f"_t{res}"] = df["h3_r10"].apply(lambda t: h3.cell_to_parent(t, res))

    cuisines    = sorted([c for c in df["cuisine_type"].dropna().unique() if c != ""]) + [""]
    costs       = sorted([c for c in df["cost"].dropna().unique() if c != ""]) + [""]
    venue_types = sorted([v for v in df["venue_type"].dropna().unique() if v != ""]) + [""]
    bases       = [0, 1, 2]    # score_basis
    score_tiers = [0, 1, 2, 3, 4] # output tiers: cumulative thresholds on input tier value

    rows = []
    total = len(bases) * len(score_tiers) * len(cuisines) * len(costs) * len(venue_types) * len(H3_RESOLUTIONS)
    done  = 0

    for base in bases:
        tier_col = TIER_COLS[base]
        for res in H3_RESOLUTIONS:
            tile_col = "h3_r10" if res == 10 else f"_t{res}"
            for score_tier, cuisine, cost, venue in itertools.product(score_tiers, cuisines, costs, venue_types):
                mask = pd.Series(True, index=df.index)
                if cuisine:
                    mask &= df["cuisine_type"] == cuisine
                if cost:
                    mask &= df["cost"] == cost
                if venue:
                    mask &= df["venue_type"] == venue

                # Apply tier filter on the chosen tier column
                tier_fn = TIER_FILTERS[score_tier]
                mask &= tier_fn(df[tier_col])

                agg = (
                    df[mask]
                    .groupby(tile_col, sort=False)
                    .size()
                    .reset_index(name="count")
                    .rename(columns={tile_col: "tile"})
                )
                if agg.empty:
                    done += 1
                    continue

                agg["resolution"]   = res
                agg["cuisine_type"] = cuisine
                agg["cost"]         = cost
                agg["venue_type"]   = venue
                agg["score_basis"]  = base
                agg["score_tier"]   = score_tier
                rows.append(agg)
                done += 1

            if done % 5000 == 0:
                print(f"  {done:,} / {total:,} combos processed …", flush=True)

    print(f"  {done:,} / {total:,} combos processed … done")
    return (
        pd.concat(rows, ignore_index=True)
        [["tile", "resolution", "cuisine_type", "cost", "venue_type",
          "score_basis", "score_tier", "count"]]
    )
