-- London Explorer — Cloud DB Schema
-- Run once against your Neon database.
-- PostGIS is natively supported on Neon; H3 math runs in Python (no h3-pg needed).
--
-- Design notes:
--   • h3_r10  = H3 res-10 cell — the finest tile grain, used for nearby k-ring lookups.
--   • places.csv now carries the latest field names directly (primaryTypeDisplayName,
--     shortFormattedAddress, predictedType, tier*, wilson_1, normal_1).
--   • The API computes its list ranks from normal_1 / wilson_1 at query time.
--   • Detail-card fields (address, website, etc.) are only fetched on pin tap.

-- ─── EXTENSION ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;


-- ─── TABLE 1: places ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS h3_density;
DROP TABLE IF EXISTS places;

CREATE TABLE places (
    -- identity
    id                  TEXT             PRIMARY KEY,
    display_name        TEXT             NOT NULL,
    primary_type_display_name TEXT,
    rating              REAL,
    user_rating_count   INTEGER,
    short_formatted_address TEXT,
    google_maps_uri     TEXT,
    website_uri         TEXT,
    types               TEXT,
    primary_type        TEXT,
    is_chain            BOOLEAN,
    predicted_type      TEXT,
    cuisine_type        TEXT,           -- e.g. 'Chinese', 'Southeast Asian'
    venue_type          TEXT,           -- 'Dine-In' | 'Takeaway'
    lat                 DOUBLE PRECISION NOT NULL,
    lon                 DOUBLE PRECISION NOT NULL,
    geom                GEOMETRY(Point, 4326) GENERATED ALWAYS AS (
                            ST_SetSRID(ST_MakePoint(lon, lat), 4326)
                        ) STORED,
    h3_r10              TEXT             NOT NULL,  -- H3 res-10 cell ID
    pcd                 TEXT,
    areacode            TEXT,
    wheelchair_access   BOOLEAN,
    operational         BOOLEAN,        -- FALSE = temporarily closed; frontend may grey out pin
    cost                TEXT,           -- '<10' | '10+' | '20+' | '40+' | '60+' | '100+'

    -- latest pipeline metrics
    wilson_1            REAL,
    normal_1            REAL,
    tier                SMALLINT,
    tier_d              SMALLINT,
    tier_independent    SMALLINT
);

-- h3_r10 index: drives the nearby-search k-ring pre-filter
CREATE INDEX idx_places_h3_r10     ON places(h3_r10);
-- GIST index: drives ST_DWithin exact distance check
CREATE INDEX idx_places_geom       ON places USING GIST(geom);
-- Composite: cuisine filter + base ranking sort (normal_1)
CREATE INDEX idx_places_normal_1   ON places(cuisine_type, normal_1 DESC);
-- Composite: cuisine filter + raw Wilson ranking sort (wilson_1)
CREATE INDEX idx_places_wilson_1   ON places(cuisine_type, wilson_1 DESC);
-- Note: score_tier is a display-only field (card badge). Filtering always uses
-- normal_1/wilson_1 float thresholds directly — no extra sort columns needed.


-- ─── TABLE 2: h3_density ─────────────────────────────────────────────────────
-- Pre-aggregated counts per H3 tile, eliminating GROUP BY on every pan/zoom.
-- '' for cuisine_type / cost / venue_type = "all" (no filter on that dimension).
--
-- score_tier uses CUMULATIVE thresholds (used as a pre-filter, not a display band):
--   0 = all  |  1 = above avg  |  2 = strong  |  3 = top 10%  |  4 = top 5%
--
-- score_basis:  0 = base  |  1 = diversity-aware  |  2 = independent
-- Resolutions: 7=city, 8=neighbourhood, 9=street, 10=finest (heatmap off at 10).

CREATE TABLE h3_density (
    tile            TEXT     NOT NULL,
    resolution      SMALLINT NOT NULL,  -- 7 | 8 | 9 | 10
    cuisine_type    TEXT     NOT NULL DEFAULT '',
    cost            TEXT     NOT NULL DEFAULT '',
    venue_type      TEXT     NOT NULL DEFAULT '',   -- '' | 'Dine-In' | 'Takeaway'
    score_basis     SMALLINT NOT NULL DEFAULT 0,    -- 0=base | 1=diversity-aware | 2=independent
    score_tier      SMALLINT NOT NULL DEFAULT 0,    -- cumulative: 0=all, 1=above avg, 2=strong, 3=top 10%, 4=top 5%
    count           INTEGER  NOT NULL,
    PRIMARY KEY (tile, resolution, cuisine_type, cost, venue_type, score_basis, score_tier)
);

-- Covers the tile endpoint query: WHERE resolution=? AND tile=ANY(?)
CREATE INDEX idx_h3_density_lookup ON h3_density(resolution, tile);
