SQL_NEARBY = """
    SELECT
        id,
        display_name,
        lat,
        lon,
        cuisine_type,
        venue_type,
        cost,
        rating,
        user_rating_count,
        operational,
        {rank_column} AS rank
    FROM places
    WHERE city_slug = $1
        AND h3_r10 = ANY($2::TEXT[])
        AND ST_DWithin(
            geom::geography,
            ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
            $5
        )
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
                AND (
                      CARDINALITY($8::TEXT[]) = 0  -- no filter, show all costs
                      OR (CARDINALITY($8::TEXT[]) > 0 AND (
                            cost = ANY(ARRAY_REMOVE($8::TEXT[], '__null__'))
                            OR ('__null__' = ANY($8::TEXT[]) AND cost IS NULL)
                          ))
                    )
        AND {rank_column} >= $9
    ORDER BY {rank_column} DESC
    LIMIT {page_size}
    OFFSET $10
"""

