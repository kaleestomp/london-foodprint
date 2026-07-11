from api.map_util.map_util import PAGE_SIZE_ON_ZOOM, PAGE_SIZE_ON_REQUEST

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
      AND (
            (CARDINALITY($5::TEXT[]) = 0 AND cuisine_type IS NULL)
            OR (CARDINALITY($5::TEXT[]) > 0 AND (
                  cuisine_type = ANY(ARRAY_REMOVE($5::TEXT[], '__null__'))
                  OR ('__null__' = ANY($5::TEXT[]) AND cuisine_type IS NULL)
                ))
          )
      AND (
            ($6 = '' AND venue_type IS NULL)
            OR ($6 != '' AND venue_type = $6)
          )
      AND (
            (CARDINALITY($7::TEXT[]) = 0 AND cost IS NULL)
            OR (CARDINALITY($7::TEXT[]) > 0 AND (
                  cost = ANY(ARRAY_REMOVE($7::TEXT[], '__null__'))
                  OR ('__null__' = ANY($7::TEXT[]) AND cost IS NULL)
                ))
          )
      AND {rank_column} >= $8
    ORDER BY {rank_column} DESC
    LIMIT {page_size}
"""

# Aggregates place counts by H3 tile across the h3_density table. Filters by tile resolution, cuisine type,
# cost tier, and venue type to avoid double counting.
# NULL marker ('__null__') in filter arrays triggers IS NULL condition; empty array matches only NULL values.
# Query contract:
# - if filter array is empty: select only rows where dimension IS NULL
# - if filter array contains '__null__': select rows where dimension IS NULL OR dimension in concrete values
# - if filter array has only concrete values: select only matching concrete rows
TILES_SQL = """
    SELECT tile, SUM(count)::INT AS count
    FROM h3_density
    WHERE resolution = $1
      AND tile = ANY($2::TEXT[])
      AND (
            (CARDINALITY($3::TEXT[]) = 0 AND cuisine_type IS NULL)
            OR (CARDINALITY($3::TEXT[]) > 0 AND (
                  cuisine_type = ANY(ARRAY_REMOVE($3::TEXT[], '__null__'))
                  OR ('__null__' = ANY($3::TEXT[]) AND cuisine_type IS NULL)
                ))
          )
      AND (
            (CARDINALITY($4::TEXT[]) = 0 AND cost IS NULL)
            OR (CARDINALITY($4::TEXT[]) > 0 AND (
                  cost = ANY(ARRAY_REMOVE($4::TEXT[], '__null__'))
                  OR ('__null__' = ANY($4::TEXT[]) AND cost IS NULL)
                ))
          )
      AND (
            ($5 = '' AND venue_type IS NULL)
            OR ($5 != '' AND venue_type = $5)
          )
      AND score_basis = $6
      AND score_tier = $7
    GROUP BY tile
"""

# Fetches the single place's location for tiles whose aggregated count = 1.
# Called only on the singleton-tile subset returned by TILES_SQL.
# Applies same NULL-aware filtering as TILES_SQL to ensure the place matches its aggregated count.
SINGLETON_SQL = """
    SELECT
        h3_r10 AS tile,
        id,
        lat,
        lon
    FROM places
    WHERE h3_r10 = ANY($1::TEXT[])
      AND (
            (CARDINALITY($2::TEXT[]) = 0 AND cuisine_type IS NULL)
            OR (CARDINALITY($2::TEXT[]) > 0 AND (
                  cuisine_type = ANY(ARRAY_REMOVE($2::TEXT[], '__null__'))
                  OR ('__null__' = ANY($2::TEXT[]) AND cuisine_type IS NULL)
                ))
          )
      AND (
            ($3 = '' AND venue_type IS NULL)
            OR ($3 != '' AND venue_type = $3)
          )
      AND (
            (CARDINALITY($4::TEXT[]) = 0 AND cost IS NULL)
            OR (CARDINALITY($4::TEXT[]) > 0 AND (
                  cost = ANY(ARRAY_REMOVE($4::TEXT[], '__null__'))
                  OR ('__null__' = ANY($4::TEXT[]) AND cost IS NULL)
                ))
          )
      AND {rank_column} >= $5
"""

