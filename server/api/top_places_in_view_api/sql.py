TOP_PLACES_IN_VIEW_SQL = """
    SELECT
      id,
      lat,
      lon,
      {rank_column} AS rank
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
    LIMIT $9
"""
