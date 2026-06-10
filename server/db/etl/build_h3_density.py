"""
build_h3_density.py
-------------------
Builds the h3_density pre-aggregation DataFrame from a places DataFrame.
Pure data transform — no file I/O, no DB calls.

Input columns required:
    h3_r10, cuisine_type, cost, venue_type
    bnormal_0, bnormal_1, bnormal_2   (competition-boosted ranks)
    normal_0,  normal_1,  normal_2    (raw Wilson ranks)

Output columns:
    tile, resolution, cuisine_type, cost, venue_type,
    score_basis, confidence, score_tier, count

Score tier semantics (CUMULATIVE thresholds — matches the frontend filter):
    0 = all
    2 = above average  (rank >= 0.50)
    3 = top 25%        (rank >= 0.75)
    4 = top 10%        (rank >= 0.90)
    (tier 1 / below average excluded)

score_basis: 0 = boosted | 1 = raw Wilson
confidence:  0 = lenient (90%) | 1 = moderate (95%) | 2 = conservative (99%)
"""
import itertools

import h3
import pandas as pd

H3_RESOLUTIONS = [7, 8, 9, 10]

# Maps (score_basis, confidence) → rank column in the input DataFrame
RANK_COLS = {
    (0, 0): "bnormal_0",
    (0, 1): "bnormal_1",
    (0, 2): "bnormal_2",
    (1, 0): "normal_0",
    (1, 1): "normal_1",
    (1, 2): "normal_2",
}

# Vectorised tier masks applied to a rank Series
# None = no filter (all rows pass)
TIER_MASKS = {
    0: None,
    1: lambda r: r <  0.50,
    2: lambda r: r >= 0.50,
    3: lambda r: r >= 0.75,
    4: lambda r: r >= 0.90,
}


def build_h3_density(df: pd.DataFrame) -> pd.DataFrame:
    """
    Pre-aggregate restaurant counts across all filter dimension combinations.
    Only non-zero count rows are returned.
    """
    # Pre-compute parent tile IDs at coarser resolutions from the res-10 base
    for res in [7, 8, 9]:
        df[f"_t{res}"] = df["h3_r10"].apply(lambda t: h3.cell_to_parent(t, res))

    cuisines    = sorted(df["cuisine_type"].dropna().unique().tolist()) + [""]
    costs       = sorted(df["cost"].dropna().unique().tolist()) + [""]
    venue_types = sorted(df["venue_type"].dropna().unique().tolist()) + [""]
    bases       = [0, 1]        # score_basis
    confidences = [0, 1, 2]     # confidence level
    tiers       = [0, 2, 3, 4]  # 0=all, 2=above avg, 3=top 25%, 4=top 10%  (tier 1/below avg excluded)

    rows = []
    total = len(bases) * len(confidences) * len(tiers) * len(cuisines) * len(costs) * len(venue_types) * len(H3_RESOLUTIONS)
    done  = 0

    for base, conf in itertools.product(bases, confidences):
        rank_col = RANK_COLS[(base, conf)]
        for res in H3_RESOLUTIONS:
            tile_col = "h3_r10" if res == 10 else f"_t{res}"
            for tier, cuisine, cost, venue in itertools.product(tiers, cuisines, costs, venue_types):
                mask = pd.Series(True, index=df.index)
                if cuisine:
                    mask &= df["cuisine_type"] == cuisine
                if cost:
                    mask &= df["cost"] == cost
                if venue:
                    mask &= df["venue_type"] == venue
                tier_fn = TIER_MASKS[tier]
                if tier_fn is not None:
                    mask &= tier_fn(df[rank_col])

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
                agg["confidence"]   = conf
                agg["score_tier"]   = tier
                rows.append(agg)
                done += 1

            if done % 5000 == 0:
                print(f"  {done:,} / {total:,} combos processed …", flush=True)

    print(f"  {done:,} / {total:,} combos processed … done")
    return (
        pd.concat(rows, ignore_index=True)
        [["tile", "resolution", "cuisine_type", "cost", "venue_type",
          "score_basis", "confidence", "score_tier", "count"]]
    )
