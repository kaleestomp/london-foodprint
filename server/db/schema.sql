-- London Explorer — Cloud DB Schema
-- Run once against your Neon database.
-- PostGIS is natively supported on Neon; H3 math runs in Python (no h3-pg needed).
--
-- Design notes:
--   • h3_r10  = H3 res-10 cell — the finest tile grain, used for nearby k-ring lookups.
--   • score/rank columns use a tri-confidence ranking system from the pipeline:
--       _0 = broad, _1 = medium (primary sort key), _2 = conservative
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
    lat                 DOUBLE PRECISION NOT NULL,
    lon                 DOUBLE PRECISION NOT NULL,
    geom                GEOMETRY(Point, 4326) GENERATED ALWAYS AS (
                            ST_SetSRID(ST_MakePoint(lon, lat), 4326)
                        ) STORED,
    h3_r10              TEXT             NOT NULL,  -- H3 res-10 cell ID

    -- classification  (used for filtering and map card display)
    cuisine_type        TEXT,           -- e.g. 'Chinese', 'Southeast Asian'
    venue_type          TEXT,           -- 'Dine-In' | 'Takeaway'
    cost                TEXT,           -- '<10' | '10+' | '20+' | '40+' | '60+' | '100+'
    is_chain            BOOLEAN,
    operational         BOOLEAN,        -- FALSE = temporarily closed; frontend may grey out pin
    primary_type        TEXT,           -- Google primaryType slug
    type_label          TEXT,           -- human label, e.g. 'Thai Restaurant'

    -- metrics
    rating              REAL,
    user_rating_count   INTEGER,

    -- ranking scores — competition-boosted (tri-confidence; _1 is the primary sort key)
    -- Toggle: frontend switches ORDER BY between rank_1 (boosted) and wrank_1 (raw)
    score_0             REAL,   rank_0  REAL,
    score_1             REAL,   rank_1  REAL,
    score_2             REAL,   rank_2  REAL,

    -- ranking scores — raw Wilson (no competition adjustment)
    wscore_0            REAL,   wrank_0 REAL,
    wscore_1            REAL,   wrank_1 REAL,
    wscore_2            REAL,   wrank_2 REAL,


    -- detail card fields (fetched only on pin tap)
    address             TEXT,
    postcode            TEXT,
    area_code           TEXT,
    google_maps_uri     TEXT,
    website_uri         TEXT,
    wheelchair_access   BOOLEAN
);

-- h3_r10 index: drives the nearby-search k-ring pre-filter
CREATE INDEX idx_places_h3_r10     ON places(h3_r10);
-- GIST index: drives ST_DWithin exact distance check
CREATE INDEX idx_places_geom       ON places USING GIST(geom);
-- Composite: cuisine filter + boosted rank sort
CREATE INDEX idx_places_rank        ON places(cuisine_type, rank_1 DESC);
-- Composite: cuisine filter + raw Wilson rank sort (for unboosted toggle)
CREATE INDEX idx_places_wrank       ON places(cuisine_type, wrank_1 DESC);
-- Note: score_tier is a display-only field (card badge). Filtering always uses
-- rank_1/wrank_1 float thresholds directly — no index on score_tier needed.


-- ─── TABLE 2: h3_density ─────────────────────────────────────────────────────
-- Pre-aggregated counts per H3 tile, eliminating GROUP BY on every pan/zoom.
-- '' for cuisine_type / cost / venue_type = "all" (no filter on that dimension).
--
-- score_tier uses CUMULATIVE thresholds (used as a pre-filter, not a display band):
--   0 = all  |  2 = above avg (≥0.50)  |  3 = top 25% (≥0.75)  |  4 = top 10% (≥0.90)
--   (tier 1 / below average excluded — not a useful map filter)
--
-- score_basis:  0 = competition-boosted  |  1 = raw Wilson
-- confidence:   0 = lenient 90%  |  1 = moderate 95%  |  2 = conservative 99%
-- Resolutions: 7=city, 8=neighbourhood, 9=street, 10=finest (heatmap off at 10).

CREATE TABLE h3_density (
    tile            TEXT     NOT NULL,
    resolution      SMALLINT NOT NULL,  -- 7 | 8 | 9 | 10
    cuisine_type    TEXT     NOT NULL DEFAULT '',
    cost            TEXT     NOT NULL DEFAULT '',
    venue_type      TEXT     NOT NULL DEFAULT '',   -- '' | 'Dine-In' | 'Takeaway'
    score_basis     SMALLINT NOT NULL DEFAULT 0,    -- 0=boosted | 1=raw
    confidence      SMALLINT NOT NULL DEFAULT 1,    -- 0=lenient | 1=moderate | 2=conservative
    score_tier      SMALLINT NOT NULL DEFAULT 0,    -- cumulative: 0=all, 2=above avg, 3=top 25%, 4=top 10% 1 excluded (below avg)
    count           INTEGER  NOT NULL,
    PRIMARY KEY (tile, resolution, cuisine_type, cost, venue_type, score_basis, confidence, score_tier)
);

-- Covers the tile endpoint query: WHERE resolution=? AND tile=ANY(?)
CREATE INDEX idx_h3_density_lookup ON h3_density(resolution, tile);
