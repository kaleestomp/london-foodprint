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
    LIMIT {page_size}
    OFFSET $9
"""

