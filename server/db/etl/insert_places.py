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
            row.primaryTypeDisplayName if pd.notna(row.primaryTypeDisplayName) else None,
            _v(row.rating, float),
            _v(row.userRatingCount, int),
            row.shortFormattedAddress if pd.notna(row.shortFormattedAddress) else None,
            row.googleMapsUri if pd.notna(row.googleMapsUri) else None,
            row.websiteUri    if pd.notna(row.websiteUri)    else None,
            row.types if pd.notna(row.types) else None,
            row.primaryType if pd.notna(row.primaryType) else None,
            _v(row.is_chain, bool),
            row.predictedType if pd.notna(row.predictedType) else None,
            _v(row.cuisineType) or None,
            _v(row.venueType)   or None,
            float(row.lat), float(row.lon),
            row.h3_res10,
            row.h3_r11 if pd.notna(row.h3_r11) else None,
            row.pcd       if pd.notna(row.pcd)      else None,
            row.areacode  if pd.notna(row.areacode) else None,
            _v(row.wheelchairAccess, bool),
            _v(row.operational, bool),
            _v(row.cost) or None,
            _v(row.wilson_1, float),
            _v(row.normal_1, float),
            _v(row.tier, int),
            _v(row.tier_d, int),
            _v(row.tier_independent, int),
        )
        for row in df.itertuples(index=False)
    ]
    psycopg2.extras.execute_values(cur, """
        INSERT INTO places (
            id, display_name, primary_type_display_name,
            rating, user_rating_count,
            short_formatted_address, google_maps_uri, website_uri,
            types, primary_type, is_chain, predicted_type,
            cuisine_type, venue_type, lat, lon, h3_r10, h3_r11,
            pcd, areacode, wheelchair_access, operational, cost,
            wilson_1, normal_1, tier, tier_d, tier_independent
        ) VALUES %s
        ON CONFLICT (id) DO UPDATE SET
            display_name      = EXCLUDED.display_name,
            primary_type_display_name = EXCLUDED.primary_type_display_name,
            rating            = EXCLUDED.rating,
            user_rating_count = EXCLUDED.user_rating_count,
            short_formatted_address = EXCLUDED.short_formatted_address,
            google_maps_uri   = EXCLUDED.google_maps_uri,
            website_uri       = EXCLUDED.website_uri,
            types             = EXCLUDED.types,
            primary_type      = EXCLUDED.primary_type,
            is_chain          = EXCLUDED.is_chain,
            predicted_type    = EXCLUDED.predicted_type,
            cuisine_type      = EXCLUDED.cuisine_type,
            venue_type        = EXCLUDED.venue_type,
            lat               = EXCLUDED.lat,
            lon               = EXCLUDED.lon,
            h3_r10            = EXCLUDED.h3_r10,
            h3_r11            = EXCLUDED.h3_r11,
            pcd               = EXCLUDED.pcd,
            areacode          = EXCLUDED.areacode,
            wheelchair_access = EXCLUDED.wheelchair_access,
            operational       = EXCLUDED.operational,
            cost              = EXCLUDED.cost,
            wilson_1          = EXCLUDED.wilson_1,
            normal_1          = EXCLUDED.normal_1,
            tier              = EXCLUDED.tier,
            tier_d            = EXCLUDED.tier_d,
            tier_independent  = EXCLUDED.tier_independent
    """, records, page_size=500)
    print(f"  {len(records):,} places upserted")
