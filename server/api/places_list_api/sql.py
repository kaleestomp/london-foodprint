SQL_PLACES_LIST = """
        SELECT
            id,
            lat,
            lon,
            {sort_column} AS ranking,
            display_name,
            cuisine_type,
            cost AS price,
            CASE
                WHEN $8::BOOLEAN THEN (
                    6371000 * 2 * ASIN(
                        SQRT(
                            POWER(SIN(RADIANS((lat - $9) / 2)), 2)
                            + COS(RADIANS($9)) * COS(RADIANS(lat))
                            * POWER(SIN(RADIANS((lon - $10) / 2)), 2)
                        )
                    )
                )
                ELSE NULL
            END AS distance_m,
            is_chain,
            venue_type,
            google_maps_uri,
            website_uri
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
          AND (
                NOT $8::BOOLEAN
                OR (
                    6371000 * 2 * ASIN(
                        SQRT(
                            POWER(SIN(RADIANS((lat - $9) / 2)), 2)
                            + COS(RADIANS($9)) * COS(RADIANS(lat))
                            * POWER(SIN(RADIANS((lon - $10) / 2)), 2)
                        )
                    ) <= $11
                )
              )
                    {tier_filter}
        ORDER BY {sort_column} DESC, id ASC 
        LIMIT {page_size}
        OFFSET $13
    """