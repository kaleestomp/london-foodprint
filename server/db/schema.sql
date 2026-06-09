-- London Explorer — Cloud DB Schema
-- Run this once against your Neon database.
-- Neon supports PostGIS natively; h3-pg is NOT needed (all H3 math runs in Python).

-- ─── EXTENSION ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;


-- ─── TABLE 1: places ─────────────────────────────────────────────────────────
-- One row per restaurant. Source: server/out/places.csv (after ETL upgrade)

CREATE TABLE IF NOT EXISTS places (
    id                      TEXT PRIMARY KEY,
    display_name            TEXT        NOT NULL,
    lat                     DOUBLE PRECISION NOT NULL,
    lon                     DOUBLE PRECISION NOT NULL,
    geom                    GEOMETRY(Point, 4326) GENERATED ALWAYS AS (
                                ST_SetSRID(ST_MakePoint(lon, lat), 4326)
                            ) STORED,
    local_tile              TEXT        NOT NULL,  -- H3 res-10 cell ID
    cuisine_type            TEXT,
    price_band              TEXT,                  -- '<20' | '<50' | '<100' | '100+' | NULL
    rating                  REAL,
    user_rating_count       INTEGER,
    wilson_score            REAL,
    adjusted_score          REAL,
    adjusted_quantile       REAL,
    seed_index              INTEGER,
    primary_type            TEXT,
    address                 TEXT,
    google_maps_uri         TEXT
);

CREATE INDEX IF NOT EXISTS idx_places_local_tile
    ON places(local_tile);

CREATE INDEX IF NOT EXISTS idx_places_geom
    ON places USING GIST(geom);

CREATE INDEX IF NOT EXISTS idx_places_cuisine_rank
    ON places(cuisine_type, adjusted_quantile DESC);


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
