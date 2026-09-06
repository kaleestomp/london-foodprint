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
                WHEN $9::BOOLEAN THEN (
                    6371000 * 2 * ASIN(
                        SQRT(
                            POWER(SIN(RADIANS((lat - $10) / 2)), 2)
                            + COS(RADIANS($10)) * COS(RADIANS(lat))
                            * POWER(SIN(RADIANS((lon - $11) / 2)), 2)
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
          AND (
                CARDINALITY($8::TEXT[]) = 0  -- no filter, show all costs
                OR (CARDINALITY($8::TEXT[]) > 0 AND (
                      cost = ANY(ARRAY_REMOVE($8::TEXT[], '__null__'))
                      OR ('__null__' = ANY($8::TEXT[]) AND cost IS NULL)
                    ))
              )
          AND (
                NOT $9::BOOLEAN
                OR (
                    6371000 * 2 * ASIN(
                        SQRT(
                            POWER(SIN(RADIANS((lat - $10) / 2)), 2)
                            + COS(RADIANS($10)) * COS(RADIANS(lat))
                            * POWER(SIN(RADIANS((lon - $11) / 2)), 2)
                        )
                    ) <= $12
                )
              )
                    {tier_filter}
        ORDER BY {sort_column} DESC, id ASC 
        LIMIT {page_size}
        OFFSET $14
    """