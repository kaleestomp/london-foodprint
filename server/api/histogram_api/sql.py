# Citywide: no bbox — scans the full places table filtered by city/cuisine/venue/rank.
SQL_CITYWIDE_PRICE = """
    SELECT cost, COUNT(*)::INT AS count
    FROM places
    WHERE city_slug = $1
      AND (
            CARDINALITY($2::TEXT[]) = 0  -- no filter, show all cuisines
            OR (CARDINALITY($2::TEXT[]) > 0 AND (
                  cuisine_type = ANY(ARRAY_REMOVE($2::TEXT[], '__null__'))
                  OR ('__null__' = ANY($2::TEXT[]) AND cuisine_type IS NULL)
                ))
          )
      AND (
            $3 = '__all__'  -- no filter, all venues
            OR ($3 = '__null__' AND venue_type IS NULL)
            OR ($3 != '__all__' AND $3 != '__null__' AND venue_type = $3)
          )
      AND cost IS NOT NULL
      AND cost IN ('<10', '10+', '20+', '40+', '60+', '100+')
      AND {rank_column} >= $4
    GROUP BY cost
"""

# View: filters by the current viewport bbox.
SQL_VIEW_PRICE = """
    SELECT cost, COUNT(*)::INT AS count
    FROM places
    WHERE city_slug = $1
      AND lat BETWEEN $2 AND $3
      AND lon BETWEEN $4 AND $5
      AND (
            CARDINALITY($6::TEXT[]) = 0  -- no filter, show all cuisines
            OR (CARDINALITY($6::TEXT[]) > 0 AND (
                  cuisine_type = ANY(ARRAY_REMOVE($6::TEXT[], '__null__'))
                  OR ('__null__' = ANY($6::TEXT[]) AND cuisine_type IS NULL)
                ))
          )
      AND (
            $7 = '__all__'  -- no filter, all venues
            OR ($7 = '__null__' AND venue_type IS NULL)
            OR ($7 != '__all__' AND $7 != '__null__' AND venue_type = $7)
          )
      AND cost IS NOT NULL
      AND cost IN ('<10', '10+', '20+', '40+', '60+', '100+')
      AND {rank_column} >= $8
    GROUP BY cost
"""

# Nearby bubble: filters within radius from a center point.
SQL_NEARBY_PRICE = """
    SELECT cost, COUNT(*)::INT AS count
    FROM places
    WHERE city_slug = $1
      AND ST_DWithin(
            geom::geography,
            ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
            $4
          )
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
      AND cost IS NOT NULL
      AND cost IN ('<10', '10+', '20+', '40+', '60+', '100+')
      AND {rank_column} >= $7
    GROUP BY cost
"""

SQL_CITYWIDE_CUISINE = """
    SELECT cuisine_type AS cuisine, COUNT(*)::INT AS count
    FROM places
    WHERE city_slug = $1
      AND cuisine_type IS NOT NULL
      AND (
            $2 = '__all__'  -- no filter, all venues
            OR ($2 = '__null__' AND venue_type IS NULL)
            OR ($2 != '__all__' AND $2 != '__null__' AND venue_type = $2)
          )
      AND (
            CARDINALITY($3::TEXT[]) = 0  -- no filter, show all costs
            OR (CARDINALITY($3::TEXT[]) > 0 AND (
                  cost = ANY(ARRAY_REMOVE($3::TEXT[], '__null__'))
                  OR ('__null__' = ANY($3::TEXT[]) AND cost IS NULL)
                ))
          )
      AND {rank_column} >= $4
    GROUP BY cuisine_type
    ORDER BY count DESC, cuisine_type ASC
"""

SQL_VIEW_CUISINE = """
    SELECT cuisine_type AS cuisine, COUNT(*)::INT AS count
    FROM places
    WHERE city_slug = $1
      AND lat BETWEEN $2 AND $3
      AND lon BETWEEN $4 AND $5
      AND cuisine_type IS NOT NULL
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
    GROUP BY cuisine_type
    ORDER BY count DESC, cuisine_type ASC
"""

SQL_NEARBY_CUISINE = """
    SELECT cuisine_type AS cuisine, COUNT(*)::INT AS count
    FROM places
    WHERE city_slug = $1
      AND ST_DWithin(
            geom::geography,
            ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
            $4
          )
      AND cuisine_type IS NOT NULL
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
    GROUP BY cuisine_type
    ORDER BY count DESC, cuisine_type ASC
"""