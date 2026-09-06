-- London Explorer — Production Cloud DB Schema
-- Supports multi-city declarative list partitioning (PARTITION BY LIST (city_slug)).
-- Run once against your PostgreSQL / Neon database.

-- ─── EXTENSION ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;


-- ─── CLEANUP ──────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS h3_density CASCADE;
DROP TABLE IF EXISTS place_open_windows CASCADE;
DROP TABLE IF EXISTS places CASCADE;


-- ─── TABLE 1: places (Parent Partitioned Table) ──────────────────────────────
-- Source: refreshed places dataset (places.csv / places-sample.csv)
CREATE TABLE places (
    -- Partition key & identity
    city_slug                 TEXT             NOT NULL DEFAULT 'london',
    id                        TEXT             NOT NULL,
    display_name              TEXT             NOT NULL,
    primary_type_display_name TEXT,
    rating                    REAL,
    user_rating_count         INTEGER,
    short_formatted_address   TEXT,
    google_maps_uri           TEXT,
    website_uri               TEXT,
    types                     TEXT,
    primary_type              TEXT,

    -- Chain & classification attributes
    chain_name                TEXT,
    is_major_chain            BOOLEAN,
    is_chain                  BOOLEAN,
    predicted_type            TEXT,
    chain_count               INTEGER,
    cuisine_type              TEXT             DEFAULT NULL,  -- NULL = unspecified
    venue_type                TEXT             DEFAULT NULL,  -- NULL = unspecified

    -- Spatial location
    lat                       DOUBLE PRECISION NOT NULL,
    lon                       DOUBLE PRECISION NOT NULL,
    geom                      GEOMETRY(Point, 4326) GENERATED ALWAYS AS (
                                  ST_SetSRID(ST_MakePoint(lon, lat), 4326)
                              ) STORED,

    -- Administrative & boundary geography
    pcd                       TEXT,
    areacode                  TEXT,
    wheelchair_access         BOOLEAN,
    operational               BOOLEAN          DEFAULT TRUE,  -- FALSE = temporarily closed
    cost                      TEXT             DEFAULT NULL,  -- NULL = unspecified ('<10', '10+', '20+', '40+', '60+', '100+')

    -- Spatial H3 cell indices
    h3_r9                     TEXT             NOT NULL,
    h3_r10                    TEXT             NOT NULL,
    local_tile                TEXT,

    -- Local representation metrics
    local_rep_ratio           REAL,
    local_rep_count           INTEGER,
    local_total               INTEGER,
    rep_delta                 REAL,

    -- Ranking metrics (raw Wilson & normalized scores across model iterations 0, 1, 2)
    wilson_0                  REAL,
    normal_0                  REAL,
    wilson_1                  REAL,
    normal_1                  REAL,
    wilson_2                  REAL,
    normal_2                  REAL,

    -- Tier classifications across models (base, diversity-aware, independent)
    tier_0                    SMALLINT,
    tier_d0                   SMALLINT,
    tier_1                    SMALLINT,
    tier_d1                   SMALLINT,
    tier_2                    SMALLINT,
    tier_d2                   SMALLINT,
    tier_i0                   SMALLINT,
    tier_i1                   SMALLINT,
    tier_i2                   SMALLINT,

    PRIMARY KEY (city_slug, id)
) PARTITION BY LIST (city_slug);


-- ─── CITY PARTITIONS: places ──────────────────────────────────────────────────
CREATE TABLE places_london    PARTITION OF places FOR VALUES IN ('london');
CREATE TABLE places_newcastle PARTITION OF places FOR VALUES IN ('newcastle');


-- ─── INDEXES: places ─────────────────────────────────────────────────────────

-- 1. HOT VIEWPORT BBOX + SORT INDEXES
-- Composite (city_slug, lat, lon, normal_* DESC, id ASC) optimizes hot viewport queries with partition pruning.
-- Note: Dedicated indexes are maintained for normal_0, normal_1, normal_2.
CREATE INDEX idx_places_city_lat_lon_normal_1 ON places (city_slug, lat, lon, normal_1 DESC, id ASC);
CREATE INDEX idx_places_city_lat_lon_normal_0 ON places (city_slug, lat, lon, normal_0 DESC, id ASC);
CREATE INDEX idx_places_city_lat_lon_normal_2 ON places (city_slug, lat, lon, normal_2 DESC, id ASC);

-- 2. VIEWPORT AGGREGATION / HISTOGRAM COVERING INDEXES
-- Accelerates GROUP BY cost and GROUP BY cuisine_type on hot viewport queries.
CREATE INDEX idx_places_city_lat_lon_cost     ON places (city_slug, lat, lon, cost);
CREATE INDEX idx_places_city_lat_lon_cuisine  ON places (city_slug, lat, lon, cuisine_type);

-- 3. FILTER ATTRIBUTE INDEXES
CREATE INDEX idx_places_city_cuisine_type     ON places (city_slug, cuisine_type) WHERE cuisine_type IS NOT NULL;
CREATE INDEX idx_places_city_cost             ON places (city_slug, cost)         WHERE cost IS NOT NULL;
CREATE INDEX idx_places_city_operational      ON places (city_slug, operational)  WHERE operational = FALSE;

-- 4. SPATIAL & H3 LOOKUP INDEXES
-- Drives PostGIS ST_DWithin distance checks (nearby API & radius histograms)
CREATE INDEX idx_places_geom                  ON places USING GIST (geom);
-- Drives H3 cell lookups (nearby API k-ring filtering)
CREATE INDEX idx_places_city_h3_r10           ON places (city_slug, h3_r10);
CREATE INDEX idx_places_city_h3_r9            ON places (city_slug, h3_r9);


-- ─── TABLE 2: place_open_windows (Parent Partitioned Table) ───────────────────
-- One row per open-close interval per place, sourced from opening hours.
-- Day encoding: 0=Sun, 1=Mon, ..., 6=Sat.
-- Minute encoding: 0..1439 (minute of day).
CREATE TABLE place_open_windows (
    city_slug    TEXT     NOT NULL DEFAULT 'london',
    place_id     TEXT     NOT NULL,
    open_day     SMALLINT NOT NULL CHECK (open_day BETWEEN 0 AND 6),
    open_minute  SMALLINT NOT NULL CHECK (open_minute BETWEEN 0 AND 1439),
    close_day    SMALLINT NOT NULL CHECK (close_day BETWEEN 0 AND 6),
    close_minute SMALLINT NOT NULL CHECK (close_minute BETWEEN 0 AND 1439),
    PRIMARY KEY (city_slug, place_id, open_day, open_minute, close_day, close_minute),
    FOREIGN KEY (city_slug, place_id) REFERENCES places (city_slug, id) ON DELETE CASCADE
) PARTITION BY LIST (city_slug);


-- ─── CITY PARTITIONS: place_open_windows ──────────────────────────────────────
CREATE TABLE place_open_windows_london    PARTITION OF place_open_windows FOR VALUES IN ('london');
CREATE TABLE place_open_windows_newcastle PARTITION OF place_open_windows FOR VALUES IN ('newcastle');


-- ─── INDEXES: place_open_windows ─────────────────────────────────────────────
-- Fast lookup for all windows of a place within a city
CREATE INDEX idx_pow_place_id ON place_open_windows (city_slug, place_id);
-- Fast schedule range scan across all places for future timetable / open-now queries
CREATE INDEX idx_pow_schedule ON place_open_windows (city_slug, open_day, open_minute, close_day, close_minute);
