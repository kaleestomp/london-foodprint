TOP_PLACES_IN_VIEW_BBOX_SQL = """
    SELECT
      id,
      display_name AS restaurant_name,
      cuisine_type,
      lat,
      lon,
      normal_1,
      {rank_column} AS rank
    FROM places
    WHERE lat BETWEEN $1 AND $2
      AND lon BETWEEN $3 AND $4
      AND (
            CARDINALITY($5::TEXT[]) = 0  -- no filter, show all cuisines
            OR (CARDINALITY($5::TEXT[]) > 0 AND (
                  cuisine_type = ANY(ARRAY_REMOVE($5::TEXT[], '__null__'))
                  OR ('__null__' = ANY($5::TEXT[]) AND cuisine_type IS NULL)
                ))
          )
      AND (
            $6 = '__all__'  -- no filter, all venues
            OR ($6 = '__null__' AND venue_type IS NULL)
            OR ($6 != '__all__' AND $6 != '__null__' AND venue_type = $6)
          )
      AND (
            CARDINALITY($7::TEXT[]) = 0  -- no filter, show all costs
            OR (CARDINALITY($7::TEXT[]) > 0 AND (
                  cost = ANY(ARRAY_REMOVE($7::TEXT[], '__null__'))
                  OR ('__null__' = ANY($7::TEXT[]) AND cost IS NULL)
                ))
          )
      AND {rank_column} >= $8
    ORDER BY normal_1 DESC NULLS LAST, id ASC
    LIMIT $9
"""

TOP_PLACES_IN_VIEW_RADIUS_SQL = """
    SELECT
      id,
      display_name AS restaurant_name,
      cuisine_type,
      lat,
      lon,
      normal_1,
      {rank_column} AS rank
    FROM places
    WHERE 6371000 * acos(
            cos(radians($1)) * cos(radians(lat)) * cos(radians(lon) - radians($2))
            + sin(radians($1)) * sin(radians(lat))
          ) <= $3
      AND (
            CARDINALITY($4::TEXT[]) = 0  -- no filter, show all cuisines
            OR (CARDINALITY($4::TEXT[]) > 0 AND (
                  cuisine_type = ANY(ARRAY_REMOVE($4::TEXT[], '__null__'))
                  OR ('__null__' = ANY($4::TEXT[]) AND cuisine_type IS NULL)
                ))
          )
      AND (
            $5 = '__all__'  -- no filter, all venues
            OR ($5 = '__null__' AND venue_type IS NULL)
            OR ($5 != '__all__' AND $5 != '__null__' AND venue_type = $5)
          )
      AND (
            CARDINALITY($6::TEXT[]) = 0  -- no filter, show all costs
            OR (CARDINALITY($6::TEXT[]) > 0 AND (
                  cost = ANY(ARRAY_REMOVE($6::TEXT[], '__null__'))
                  OR ('__null__' = ANY($6::TEXT[]) AND cost IS NULL)
                ))
          )
      AND {rank_column} >= $7
    ORDER BY normal_1 DESC NULLS LAST, id ASC
    LIMIT $8
"""
