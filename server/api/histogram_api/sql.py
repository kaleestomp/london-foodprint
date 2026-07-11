# Citywide: no bbox — scans the full places table filtered by cuisine/venue/rank.
SQL_CITYWIDE_PRICE = """
    SELECT cost, COUNT(*)::INT AS count
    FROM places
    WHERE (
            CARDINALITY($1::TEXT[]) = 0  -- no filter, show all cuisines
            OR (CARDINALITY($1::TEXT[]) > 0 AND (
                  cuisine_type = ANY(ARRAY_REMOVE($1::TEXT[], '__null__'))
                  OR ('__null__' = ANY($1::TEXT[]) AND cuisine_type IS NULL)
                ))
          )
      AND (
            $2 = '__all__'  -- no filter, all venues
            OR ($2 = '__null__' AND venue_type IS NULL)
            OR ($2 != '__all__' AND $2 != '__null__' AND venue_type = $2)
          )
      AND cost IS NOT NULL
      AND cost IN ('<10', '10+', '20+', '40+', '60+', '100+')
      AND {rank_column} >= $3
    GROUP BY cost
"""

# View: filters by the current viewport bbox.
SQL_VIEW_PRICE = """
    SELECT cost, COUNT(*)::INT AS count
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
      AND cost IS NOT NULL
      AND cost IN ('<10', '10+', '20+', '40+', '60+', '100+')
      AND {rank_column} >= $7
    GROUP BY cost
"""

SQL_CITYWIDE_CUISINE = """
    SELECT cuisine_type AS cuisine, COUNT(*)::INT AS count
    FROM places
    WHERE cuisine_type IS NOT NULL
      AND (
            $1 = '__all__'  -- no filter, all venues
            OR ($1 = '__null__' AND venue_type IS NULL)
            OR ($1 != '__all__' AND $1 != '__null__' AND venue_type = $1)
          )
      AND (
            CARDINALITY($2::TEXT[]) = 0  -- no filter, show all costs
            OR (CARDINALITY($2::TEXT[]) > 0 AND (
                  cost = ANY(ARRAY_REMOVE($2::TEXT[], '__null__'))
                  OR ('__null__' = ANY($2::TEXT[]) AND cost IS NULL)
                ))
          )
      AND {rank_column} >= $3
    GROUP BY cuisine_type
    ORDER BY count DESC, cuisine_type ASC
"""

SQL_VIEW_CUISINE = """
    SELECT cuisine_type AS cuisine, COUNT(*)::INT AS count
    FROM places
    WHERE lat BETWEEN $1 AND $2
      AND lon BETWEEN $3 AND $4
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