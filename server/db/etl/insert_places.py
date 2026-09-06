import pandas as pd
import psycopg2
import psycopg2.extras

# ─── Insert helpers ───────────────────────────────────────────────────────────
def _v(val, cast=None):
    """Return None for NaN/None/pd.NA, otherwise optionally cast."""
    if pd.isna(val):
        return None
    return cast(val) if cast else val

def insert_places(cur, df: pd.DataFrame) -> None:
    records = [
        (
            getattr(row, 'city_slug', 'london'),
            row.id,
            row.displayName,
            row.primaryTypeDisplayName if hasattr(row, 'primaryTypeDisplayName') and pd.notna(row.primaryTypeDisplayName) else None,
            _v(getattr(row, 'rating', None), float),
            _v(getattr(row, 'userRatingCount', None), int),
            row.shortFormattedAddress if hasattr(row, 'shortFormattedAddress') and pd.notna(row.shortFormattedAddress) else None,
            row.googleMapsUri if hasattr(row, 'googleMapsUri') and pd.notna(row.googleMapsUri) else None,
            row.websiteUri if hasattr(row, 'websiteUri') and pd.notna(row.websiteUri) else None,
            row.types if hasattr(row, 'types') and pd.notna(row.types) else None,
            row.primaryType if hasattr(row, 'primaryType') and pd.notna(row.primaryType) else None,
            row.chain_name if hasattr(row, 'chain_name') and pd.notna(row.chain_name) else None,
            _v(getattr(row, 'is_major_chain', None), bool),
            _v(getattr(row, 'is_chain', None), bool),
            row.predictedType if hasattr(row, 'predictedType') and pd.notna(row.predictedType) else None,
            _v(getattr(row, 'chain_count', None), int),
            _v(getattr(row, 'cuisineType', None)) or None,
            _v(getattr(row, 'venueType', None)) or None,
            float(row.lat), float(row.lon),
            row.pcd if hasattr(row, 'pcd') and pd.notna(row.pcd) else None,
            row.areacode if hasattr(row, 'areacode') and pd.notna(row.areacode) else None,
            _v(getattr(row, 'wheelchairAccess', None), bool),
            _v(getattr(row, 'operational', None), bool),
            _v(getattr(row, 'cost', None)) or None,
            str(getattr(row, 'h3_res9', getattr(row, 'h3_r9', ''))),
            str(getattr(row, 'h3_res10', getattr(row, 'h3_r10', ''))),
            row.local_tile if hasattr(row, 'local_tile') and pd.notna(row.local_tile) else None,
            _v(getattr(row, 'local_rep_ratio', None), float),
            _v(getattr(row, 'local_rep_count', None), int),
            _v(getattr(row, 'local_total', None), int),
            _v(getattr(row, 'rep_delta', None), float),
            _v(getattr(row, 'wilson_0', None), float),
            _v(getattr(row, 'normal_0', None), float),
            _v(getattr(row, 'wilson_1', None), float),
            _v(getattr(row, 'normal_1', None), float),
            _v(getattr(row, 'wilson_2', None), float),
            _v(getattr(row, 'normal_2', None), float),
            _v(getattr(row, 'tier_0', None), int),
            _v(getattr(row, 'tier_d0', None), int),
            _v(getattr(row, 'tier_1', None), int),
            _v(getattr(row, 'tier_d1', None), int),
            _v(getattr(row, 'tier_2', None), int),
            _v(getattr(row, 'tier_d2', None), int),
            _v(getattr(row, 'tier_i0', None), int),
            _v(getattr(row, 'tier_i1', None), int),
            _v(getattr(row, 'tier_i2', None), int),
        )
        for row in df.itertuples(index=False)
    ]
    psycopg2.extras.execute_values(cur, """
        INSERT INTO places (
            city_slug, id, display_name, primary_type_display_name,
            rating, user_rating_count,
            short_formatted_address, google_maps_uri, website_uri,
            types, primary_type, chain_name, is_major_chain, is_chain,
            predicted_type, chain_count, cuisine_type, venue_type,
            lat, lon, pcd, areacode, wheelchair_access, operational, cost,
            h3_r9, h3_r10, local_tile, local_rep_ratio, local_rep_count,
            local_total, rep_delta, wilson_0, normal_0, wilson_1, normal_1,
            wilson_2, normal_2, tier_0, tier_d0, tier_1, tier_d1,
            tier_2, tier_d2, tier_i0, tier_i1, tier_i2
        ) VALUES %s
        ON CONFLICT (city_slug, id) DO UPDATE SET
            display_name              = EXCLUDED.display_name,
            primary_type_display_name = EXCLUDED.primary_type_display_name,
            rating                    = EXCLUDED.rating,
            user_rating_count         = EXCLUDED.user_rating_count,
            short_formatted_address   = EXCLUDED.short_formatted_address,
            google_maps_uri           = EXCLUDED.google_maps_uri,
            website_uri               = EXCLUDED.website_uri,
            types                     = EXCLUDED.types,
            primary_type              = EXCLUDED.primary_type,
            chain_name                = EXCLUDED.chain_name,
            is_major_chain            = EXCLUDED.is_major_chain,
            is_chain                  = EXCLUDED.is_chain,
            predicted_type            = EXCLUDED.predicted_type,
            chain_count               = EXCLUDED.chain_count,
            cuisine_type              = EXCLUDED.cuisine_type,
            venue_type                = EXCLUDED.venue_type,
            lat                       = EXCLUDED.lat,
            lon                       = EXCLUDED.lon,
            pcd                       = EXCLUDED.pcd,
            areacode                  = EXCLUDED.areacode,
            wheelchair_access         = EXCLUDED.wheelchair_access,
            operational               = EXCLUDED.operational,
            cost                      = EXCLUDED.cost,
            h3_r9                     = EXCLUDED.h3_r9,
            h3_r10                    = EXCLUDED.h3_r10,
            local_tile                = EXCLUDED.local_tile,
            local_rep_ratio           = EXCLUDED.local_rep_ratio,
            local_rep_count           = EXCLUDED.local_rep_count,
            local_total               = EXCLUDED.local_total,
            rep_delta                 = EXCLUDED.rep_delta,
            wilson_0                  = EXCLUDED.wilson_0,
            normal_0                  = EXCLUDED.normal_0,
            wilson_1                  = EXCLUDED.wilson_1,
            normal_1                  = EXCLUDED.normal_1,
            wilson_2                  = EXCLUDED.wilson_2,
            normal_2                  = EXCLUDED.normal_2,
            tier_0                    = EXCLUDED.tier_0,
            tier_d0                   = EXCLUDED.tier_d0,
            tier_1                    = EXCLUDED.tier_1,
            tier_d1                   = EXCLUDED.tier_d1,
            tier_2                    = EXCLUDED.tier_2,
            tier_d2                   = EXCLUDED.tier_d2,
            tier_i0                   = EXCLUDED.tier_i0,
            tier_i1                   = EXCLUDED.tier_i1,
            tier_i2                   = EXCLUDED.tier_i2
    """, records, page_size=500)
    print(f"  {len(records):,} places upserted")
