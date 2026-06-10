-- London Explorer — Cloud DB Schema
-- Run this once against your Neon database.
-- Neon supports PostGIS natively; h3-pg is NOT needed (all H3 math runs in Python).

-- ─── EXTENSION ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;


DROP TABLE IF EXISTS h3_density;
DROP TABLE IF EXISTS places;

-- ─── TABLE 1: places ─────────────────────────────────────────────────────────
-- One row per restaurant. Source: server/out/places.csv (after ETL upgrade)

CREATE TABLE IF NOT EXISTS places (
    id                        TEXT PRIMARY KEY,
    display_name              TEXT NOT NULL,
    primary_type_display_name  TEXT,
    lat                       DOUBLE PRECISION NOT NULL,
    lon                       DOUBLE PRECISION NOT NULL,
    geom                      GEOMETRY(Point, 4326) GENERATED ALWAYS AS (
                                  ST_SetSRID(ST_MakePoint(lon, lat), 4326)
                              ) STORED,
    h3_res9                   TEXT NOT NULL,
    h3_res10                  TEXT NOT NULL,
    types                     TEXT,
    primary_type              TEXT,
    cuisine_type              TEXT,
    venue_type                TEXT,
    predicted_type            TEXT,
    price_band                TEXT,                  -- '<20' | '<50' | '<100' | '100+' | NULL
    cost                      TEXT,
    is_chain                  BOOLEAN,
    wheelchair_access         BOOLEAN,
    operational               BOOLEAN,
    rating                    REAL,
    user_rating_count         INTEGER,
    p_local                   REAL,
    competition_factor        REAL,
    representations           INTEGER,
    wilson_0                  REAL,
    normal_0                  REAL,
    wilson_1                  REAL,
    normal_1                  REAL,
    wilson_2                  REAL,
    normal_2                  REAL,
    boosted_0                 REAL,
    bnormal_0                 REAL,
    boosted_1                 REAL,
    bnormal_1                 REAL,
    boosted_2                 REAL,
    bnormal_2                 REAL,
    pcd                       TEXT,
    areacode                  TEXT,
    address                   TEXT,
    google_maps_uri           TEXT,
    website_uri               TEXT
);

CREATE INDEX IF NOT EXISTS idx_places_h3_res9
    ON places(h3_res9);

CREATE INDEX IF NOT EXISTS idx_places_h3_res10
    ON places(h3_res10);

CREATE INDEX IF NOT EXISTS idx_places_geom
    ON places USING GIST(geom);

CREATE INDEX IF NOT EXISTS idx_places_cuisine_rank
    ON places(cuisine_type, bnormal_2 DESC);


-- ─── TABLE 2: h3_density ─────────────────────────────────────────────────────
-- Pre-aggregated tile counts at 4 H3 resolutions.
-- Eliminates GROUP BY on every pan/zoom request.
-- '' (empty string) for cuisine_type or price_band means "all" (no filter).

CREATE TABLE IF NOT EXISTS h3_density (
    tile            TEXT        NOT NULL,
    resolution      SMALLINT    NOT NULL,   -- 7 | 8 | 9 | 10
    cuisine_type    TEXT        NOT NULL DEFAULT '',
    price_band      TEXT        NOT NULL DEFAULT '',
    count           INTEGER     NOT NULL,
    PRIMARY KEY (tile, resolution, cuisine_type, price_band)
);

CREATE INDEX IF NOT EXISTS idx_h3_density_lookup
    ON h3_density(resolution, tile);
