# London Explorer — Cloud Architecture Design
**Last updated:** June 10, 2026  
**Status:** Schema finalised. ETL code complete and import-validated. Ready to run against Neon.

---

## Platform Choice

| Layer | Service | Reason |
|---|---|---|
| Cloud SQL | **Neon** (serverless PostgreSQL) | Scales to zero, free tier 0.5 GB / 191 compute-hrs, no surprise billing |
| Backend hosting | **Render.com** free tier | Also scales to zero; pairs with Neon |
| Backend framework | **FastAPI** + `asyncpg` | Already used in server/server.py |
| Frontend | React (existing) | Unchanged |

---

## File Structure

```
server/
  db/
    schema.sql            ← run once against Neon to create tables + indexes
    etl_load.py           ← orchestrator: run from server/ as `python db/etl_load.py`
    etl/
      load_places.py      ← reads server/out/places.csv, cleans, returns DataFrame
      build_h3_density.py ← pure transform: builds h3_density rows from places
      insert_places.py    ← bulk upserts into places table
      insert_h3_density.py← bulk upserts into h3_density table
  docs/
    cloud_architecture.md ← this file
```

**Import note:** `server/server.py` conflicts with `server` as a package name.  
All ETL imports use `db.etl.*` with `server/` as the `sys.path` root (not repo root).

---

## Database Tables

### Table 1: `places`
One row per restaurant (operational=True only). Source: `server/out/places.csv`

**Key design decisions:**
- `h3_r10` (H3 res-10) is the only tile column — used for k-ring nearby pre-filter
- `lat`/`lon` kept alongside `geom`: frontend needs raw floats for pin/heatmap rendering
- `score_tier` NOT stored — derived client-side from the active rank float: `rank >= 0.90 → "Top 10%"` etc.
- Six rank columns cover all 2 (boosted/raw) × 3 (confidence) scenarios; frontend switches `ORDER BY`
- Detail card fields (address, website, etc.) fetched only on pin tap via `/api/place/{id}`

```sql
CREATE TABLE places (
    id                  TEXT             PRIMARY KEY,
    display_name        TEXT             NOT NULL,
    lat                 DOUBLE PRECISION NOT NULL,
    lon                 DOUBLE PRECISION NOT NULL,
    geom                GEOMETRY(Point, 4326) GENERATED ALWAYS AS (
                            ST_SetSRID(ST_MakePoint(lon, lat), 4326)
                        ) STORED,
    h3_r10              TEXT             NOT NULL,

    cuisine_type        TEXT,            -- e.g. 'Chinese', 'Southeast Asian'
    venue_type          TEXT,            -- 'Dine-In' | 'Takeaway'
    cost                TEXT,            -- '<10' | '10+' | '20+' | '40+' | '60+' | '100+'
    is_chain            BOOLEAN,
    primary_type        TEXT,
    type_label          TEXT,

    rating              REAL,
    user_rating_count   INTEGER,

    -- boosted (competition-adjusted) ranks; _1 = moderate confidence = primary sort
    score_0  REAL,  rank_0  REAL,
    score_1  REAL,  rank_1  REAL,
    score_2  REAL,  rank_2  REAL,

    -- raw Wilson ranks (no competition adjustment)
    wscore_0 REAL,  wrank_0 REAL,
    wscore_1 REAL,  wrank_1 REAL,
    wscore_2 REAL,  wrank_2 REAL,

    -- detail card fields (pin tap only)
    address             TEXT,
    postcode            TEXT,
    area_code           TEXT,
    google_maps_uri     TEXT,
    website_uri         TEXT,
    wheelchair_access   BOOLEAN
);

CREATE INDEX idx_places_h3_r10  ON places(h3_r10);
CREATE INDEX idx_places_geom    ON places USING GIST(geom);
CREATE INDEX idx_places_rank    ON places(cuisine_type, rank_1 DESC);   -- boosted sort
CREATE INDEX idx_places_wrank   ON places(cuisine_type, wrank_1 DESC);  -- raw sort
```

---

### Table 2: `h3_density`
Pre-aggregated tile counts — eliminates GROUP BY on every pan/zoom.

**Key design decisions:**
- `score_tier` uses **cumulative** thresholds (≠ places): `0=all, 2=≥0.50, 3=≥0.75, 4=≥0.90`
- Tier 1 (below average) excluded — not a useful map filter
- `score_basis` + `confidence` reflect the 6 rank scenarios; tile counts differ geographically
  - e.g. conservative (99%) biases toward high-footfall areas (Mayfair); lenient (90%) surfaces residential gems
- `''` for any TEXT dimension = "all" (unfiltered aggregate)
- ~430k rows, ~42 MB — well within Neon free tier (500 MB limit)

```sql
CREATE TABLE h3_density (
    tile            TEXT     NOT NULL,
    resolution      SMALLINT NOT NULL,  -- 7=city | 8=neighbourhood | 9=street | 10=finest
    cuisine_type    TEXT     NOT NULL DEFAULT '',
    cost            TEXT     NOT NULL DEFAULT '',
    venue_type      TEXT     NOT NULL DEFAULT '',
    score_basis     SMALLINT NOT NULL DEFAULT 0,  -- 0=boosted | 1=raw Wilson
    confidence      SMALLINT NOT NULL DEFAULT 1,  -- 0=lenient | 1=moderate | 2=conservative
    score_tier      SMALLINT NOT NULL DEFAULT 0,  -- 0=all | 2=above avg | 3=top 25% | 4=top 10%
    count           INTEGER  NOT NULL,
    PRIMARY KEY (tile, resolution, cuisine_type, cost, venue_type, score_basis, confidence, score_tier)
);

CREATE INDEX idx_h3_density_lookup ON h3_density(resolution, tile);
```

---

## ETL

Run from `server/` directory:
```powershell
python db/etl_load.py
```

`load_places.py` normalises nulls:
- `cuisineType` → `"Unspecified"` if null
- `venueType` → `"Dine-In"` if null
- `cost` → `""` if null

`build_h3_density.py` iterates all combinations of `score_basis × confidence × tier × cuisine × cost × venue × resolution` and skips empty groupby results. Only 319 of the theoretical 984 cuisine/cost/venue combos are non-empty in the data.

---

## API Endpoints (to be built)

### Adaptive H3 zoom resolution
```
zoom 0–10  → res 7   (city)
zoom 11–13 → res 8   (neighbourhood)
zoom 14–16 → res 9   (street)
zoom 17+   → res 10  (finest; heatmap OFF)
```

### GET /api/tiles — Viewport tile density
```
?sw_lat=&sw_lng=&ne_lat=&ne_lng=&zoom=&cuisine=&cost=&venue_type=&score_basis=0&confidence=1&score_tier=0
```
Returns `{mode: "tiles", data: [{tile, count}]}` or `{mode: "places", data: [...]}` when total ≤ 20.

### GET /api/nearby — Pin drop / walk bubble
```
?lat=&lng=&radius_m=1000&cuisine=&cost=&venue_type=&score_basis=0&confidence=1&rank_threshold=0&page=1
```
- k-ring pre-filter: `h3.grid_disk(center_r10, k=ceil(radius_m / 114.2) + 1)`
- Then: `ST_DWithin(geom, point, radius_m)`
- Sort: `ORDER BY rank_1 DESC` (boosted) or `wrank_1` (raw), selected by `score_basis`
- Pagination: 20 per page

### GET /api/place/{id} — Detail card
Full metadata, fetched only on pin tap.

---

## Map Layers

| Layer | Data source | Off condition |
|---|---|---|
| H3 pin-count labels | `/api/tiles` mode=tiles | mode=places (≤20 results) |
| Smooth heatmap (Option B) | `/api/tiles` mode=tiles → `h3.cellToLatLng()` client-side | res 10 OR mode=places |
| Restaurant pins | `/api/tiles` mode=places | mode=tiles |

---

## Cost Controls

| Technique | Saves |
|---|---|
| Pre-aggregated `h3_density` | Eliminates GROUP BY on every pan |
| 60s TTL in-process cache on `/api/tiles` | Absorbs repeated pans |
| Viewport snapped to H3 tile boundary before cache key | Prevents sub-pixel cache misses |
| `asyncpg` pool `max_size=5` | Keeps Neon compute-seconds low |
| Narrow SELECT (no `*` in list endpoints) | Reduces transfer |
| Detail fields only on tap (`/api/place/{id}`) | Never sent in list/tile responses |

---

## Migration Checklist

```
[x] 1. Create server/db/schema.sql
[x] 2. Create server/db/etl/ (load, build, insert modules)
[x] 3. Validate imports and dry-run
[ ] 4. Create Neon project → add DATABASE_URL to .env
[ ] 5. Run schema.sql against Neon (Neon SQL Editor or psql)
[ ] 6. Run: python db/etl_load.py
[ ] 7. Verify: SELECT COUNT(*) FROM places; → ~12,320
[ ] 8. Verify: SELECT COUNT(*) FROM h3_density; → ~430,000
[ ] 9. Build FastAPI endpoints (/api/tiles, /api/nearby, /api/place/{id})
[ ] 10. Deploy FastAPI to Render.com, set DATABASE_URL env var
[ ] 11. Wire React frontend to new endpoints
```

---

## Concurrency Notes (20 concurrent users)

- Neon free tier: 100 connections, 0.25 vCPU — adequate for 20 users at ~10–20 qps
- `asyncpg` pool `max_size=5` handles 20 users (each query holds connection ~3ms)
- Render.com free tier (0.1 vCPU) is the actual bottleneck; upgrade to Starter ($7/mo) if needed
- Both services scale to zero when idle — no billing between sessions
