TOP_PLACES_IN_VIEW_SQL = """
    SELECT
      id,
      lat,
      lon,
      {rank_column} AS rank
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
    LIMIT $9
"""
