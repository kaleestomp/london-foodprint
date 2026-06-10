import pandas as pd
import psycopg2
import psycopg2.extras

# ─── Insert helpers ───────────────────────────────────────────────────────────
def _v(val, cast=None):
    """Return None for NaN/None, otherwise optionally cast."""
    if pd.isna(val):
        return None
    return cast(val) if cast else val

def insert_places(cur, df: pd.DataFrame) -> None:
    records = [
        (
            row.id,
            row.displayName,
            float(row.lat), float(row.lon),
            row.h3_res10,
            _v(row.cuisineType) or None,
            _v(row.venueType)   or None,
            _v(row.cost)        or None,
            _v(row.is_chain, bool),
            _v(row.operational, bool),
            row.primaryType if pd.notna(row.primaryType) else None,
            row.primaryTypeDisplayName if pd.notna(row.primaryTypeDisplayName) else None,
            _v(row.rating, float),
            _v(row.userRatingCount, int),
            _v(row.boosted_0, float), _v(row.bnormal_0, float),
            _v(row.boosted_1, float), _v(row.bnormal_1, float),
            _v(row.boosted_2, float), _v(row.bnormal_2, float),
            _v(row.wilson_0,  float), _v(row.normal_0,  float),
            _v(row.wilson_1,  float), _v(row.normal_1,  float),
            _v(row.wilson_2,  float), _v(row.normal_2,  float),
            row.shortFormattedAddress if pd.notna(row.shortFormattedAddress) else None,
            row.pcd       if pd.notna(row.pcd)      else None,
            row.areacode  if pd.notna(row.areacode) else None,
            row.googleMapsUri if pd.notna(row.googleMapsUri) else None,
            row.websiteUri    if pd.notna(row.websiteUri)    else None,
            _v(row.wheelchairAccess, bool),
        )
        for row in df.itertuples(index=False)
    ]
    psycopg2.extras.execute_values(cur, """
        INSERT INTO places (
            id, display_name, lat, lon, h3_r10,
            cuisine_type, venue_type, cost, is_chain, operational,
            primary_type, type_label,
            rating, user_rating_count,
            score_0, rank_0, score_1, rank_1, score_2, rank_2,
            wscore_0, wrank_0, wscore_1, wrank_1, wscore_2, wrank_2,
            address, postcode, area_code,
            google_maps_uri, website_uri, wheelchair_access
        ) VALUES %s
        ON CONFLICT (id) DO UPDATE SET
            display_name      = EXCLUDED.display_name,
            h3_r10            = EXCLUDED.h3_r10,
            cuisine_type      = EXCLUDED.cuisine_type,
            venue_type        = EXCLUDED.venue_type,
            cost              = EXCLUDED.cost,
            is_chain          = EXCLUDED.is_chain,
            operational       = EXCLUDED.operational,
            rating            = EXCLUDED.rating,
            user_rating_count = EXCLUDED.user_rating_count,
            score_0 = EXCLUDED.score_0,  rank_0 = EXCLUDED.rank_0,
            score_1 = EXCLUDED.score_1,  rank_1 = EXCLUDED.rank_1,
            score_2 = EXCLUDED.score_2,  rank_2 = EXCLUDED.rank_2,
            wscore_0 = EXCLUDED.wscore_0, wrank_0 = EXCLUDED.wrank_0,
            wscore_1 = EXCLUDED.wscore_1, wrank_1 = EXCLUDED.wrank_1,
            wscore_2 = EXCLUDED.wscore_2, wrank_2 = EXCLUDED.wrank_2
    """, records, page_size=500)
    print(f"  {len(records):,} places upserted")
