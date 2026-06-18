# Citywide: no bbox — scans the full places table filtered by cuisine/venue/rank.
SQL_CITYWIDE_PRICE = """
    SELECT cost, COUNT(*)::INT AS count
    FROM places
    WHERE (COALESCE(array_length($1::TEXT[], 1), 0) = 0 OR cuisine_type = ANY($1::TEXT[]))
      AND ($2 = '' OR venue_type = $2)
      AND cost IS NOT NULL AND cost <> '' AND LOWER(cost) <> 'unspecified'
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
      AND (COALESCE(array_length($5::TEXT[], 1), 0) = 0 OR cuisine_type = ANY($5::TEXT[]))
      AND ($6 = '' OR venue_type = $6)
      AND cost IS NOT NULL AND cost <> '' AND LOWER(cost) <> 'unspecified'
      AND cost IN ('<10', '10+', '20+', '40+', '60+', '100+')
      AND {rank_column} >= $7
    GROUP BY cost
"""

SQL_CITYWIDE_CUISINE = """
    SELECT cuisine_type AS cuisine, COUNT(*)::INT AS count
    FROM places
    WHERE cuisine_type IS NOT NULL
      AND cuisine_type <> ''
      AND ($1 = '' OR venue_type = $1)
      AND (
            COALESCE(array_length($2::TEXT[], 1), 0) = 0
            OR cost = ANY($2::TEXT[])
            OR cost IS NULL
            OR cost = ''
            OR LOWER(cost) = 'unspecified'
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
      AND cuisine_type <> ''
      AND ($5 = '' OR venue_type = $5)
      AND (
            COALESCE(array_length($6::TEXT[], 1), 0) = 0
            OR cost = ANY($6::TEXT[])
            OR cost IS NULL
            OR cost = ''
            OR LOWER(cost) = 'unspecified'
          )
      AND {rank_column} >= $7
    GROUP BY cuisine_type
    ORDER BY count DESC, cuisine_type ASC
"""