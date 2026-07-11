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
    WHERE h3_r10 = ANY($1::TEXT[])
        AND ST_DWithin(
            geom::geography,
            ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
            $4
        )
                AND (
                      (CARDINALITY($5::TEXT[]) = 0 AND cuisine_type IS NULL)
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
                      (CARDINALITY($7::TEXT[]) = 0 AND cost IS NULL)
                      OR (CARDINALITY($7::TEXT[]) > 0 AND (
                            cost = ANY(ARRAY_REMOVE($7::TEXT[], '__null__'))
                            OR ('__null__' = ANY($7::TEXT[]) AND cost IS NULL)
                          ))
                    )
        AND {rank_column} >= $8
    ORDER BY {rank_column} DESC
    LIMIT {page_size}
    OFFSET $9
"""

