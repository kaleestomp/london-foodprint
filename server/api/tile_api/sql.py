from api.map_common import PAGE_SIZE_ON_ZOOM, PAGE_SIZE_ON_REQUEST

# Retrieves lightweight place pin rows within a bounding box, optionally filtered by cuisine type,
# venue type, and cost tier. Returns only pin essentials: id, lat, lon, and tier (0-4) based on
# the selected rank basis column. Both {rank_column} and {page_size} are resolved
# at the call site via .format(rank_column=..., page_size=...) — no module-level pre-formatting.
# Used in two modes:
#   - places_only bypass (places_only=True): page_size=PAGE_SIZE_ON_REQUEST, skips tile density query
#   - tile fallback (inner_count <= PAGE_SIZE_ON_ZOOM): page_size=PAGE_SIZE_ON_ZOOM, triggered when
#     tile density is sparse enough to switch to individual place rendering

PLACES_SQL = """
    SELECT
        id,
        lat,
        lon,
    {rank_column} AS tier
    FROM places
    WHERE lat BETWEEN $1 AND $2
      AND lon BETWEEN $3 AND $4
      AND (COALESCE(array_length($5::TEXT[], 1), 0) = 0 OR cuisine_type = ANY($5::TEXT[]))
      AND ($6 = '' OR venue_type = $6)
      AND (
            COALESCE(array_length($7::TEXT[], 1), 0) = 0
            OR cost = ANY($7::TEXT[])
            OR cost IS NULL
            OR cost = ''
            OR LOWER(cost) = 'unspecified'
          )
      AND {rank_column} >= $8
    ORDER BY {rank_column} DESC
    LIMIT {page_size}
"""

# Aggregates place counts by H3 tile across the h3_density table. Filters by tile resolution, cuisine type,
# cost tier, and venue type to avoid double counting. Returns (tile ID, aggregated count) pairs for heatmap rendering.
# h3_density stores explicit wildcard rows (dimension='') for "no filter".
# Query contract:
# - if a filter list is empty, select only the wildcard row for that dimension;
# - if a filter list is non-empty, select only matching concrete rows.
# This avoids double counting when both wildcard + concrete rows coexist.
TILES_SQL = """
    SELECT tile, SUM(count)::INT AS count
    FROM h3_density
    WHERE resolution = $1
      AND tile = ANY($2::TEXT[])
      AND (
            (CARDINALITY($3::TEXT[]) = 0 AND cuisine_type = '')
            OR (CARDINALITY($3::TEXT[]) > 0 AND cuisine_type = ANY($3::TEXT[]))
          )
      AND (
            (CARDINALITY($4::TEXT[]) = 0 AND cost = '')
            OR (CARDINALITY($4::TEXT[]) > 0 AND (cost = ANY($4::TEXT[]) OR LOWER(cost) = 'unspecified'))
          )
      AND venue_type = $5
      AND score_basis = $6
      AND score_tier = $7
    GROUP BY tile
"""

