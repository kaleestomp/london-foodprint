SQL_PLACE_COUNT = """
    SELECT
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE {rank_column} >= ${tier_parameter})::INT AS count
    FROM places
    WHERE city_slug = $1
        AND (
            CARDINALITY($2::TEXT[]) = 0
            OR cuisine_type = ANY(ARRAY_REMOVE($2::TEXT[], '__null__'))
            OR ('__null__' = ANY($2::TEXT[]) AND cuisine_type IS NULL)
            )
        AND (
            $3 = '__all__'
            OR ($3 = '__null__' AND venue_type IS NULL)
            OR ($3 != '__all__' AND $3 != '__null__' AND venue_type = $3)
            )
        AND (
            CARDINALITY($4::TEXT[]) = 0
            OR cost = ANY(ARRAY_REMOVE($4::TEXT[], '__null__'))
            OR ('__null__' = ANY($4::TEXT[]) AND cost IS NULL)
            )
        AND {spatial_clause}
"""