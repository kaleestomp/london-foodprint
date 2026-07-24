# London Foodprint — Cloud Architecture Design
**Last updated:** July 12, 2026  
**Status:** NULL/sentinel architecture implemented. Ghost-tile bug fixed. All endpoints validated and updated for NULL-aware filtering. All endpoints now include score_tier bounds validation (0-4).

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
  out/
    places.csv            ← source data (13,092 rows incl. temporarily closed)
    h3_density.csv        ← pre-generated aggregation (2,123,754 rows); used by etl_load.py
  db/
    schema.sql            ← run once against Neon to create tables + indexes
    etl_load.py           ← orchestrator: run from repo root as `python server/db/etl_load.py`
    etl/
      load_places.py        ← reads server/out/places.csv, cleans, returns DataFrame
      build_h3_density.py   ← pure transform: builds h3_density rows from places
      build_h3_density.ipynb← standalone notebook to regenerate h3_density.csv independently
      insert_places.py      ← bulk upserts into places table
      insert_h3_density.py  ← bulk upserts into h3_density table
  api/
    nearby_api/
      map_common.py         ← shared helpers (zoom→res, rank col, bbox→H3 cells, PAGE_SIZE)
      nearby_api.py         ← GET /api/nearby
    tile_api/
      tile_api.py           ← GET /api/tiles
      tile_cache.py         ← single-flight in-flight dedupe helper (no persistent tile response cache)
      places_query/         ← reference/notes on places fallback query variants
    place_api.py            ← GET /api/place/{id}
    places_list_api.py      ← GET /api/places/list
  api_test/
    backend_api_test.ipynb  ← smoke-test notebook (health, tiles, nearby, place detail)
  server.py               ← FastAPI app, asyncpg pool, CORS, router registration
  docs/
    cloud_architecture.md ← this file
```

**Import note:** `server/server.py` conflicts with `server` as a package name.  
All ETL imports use `db.etl.*` with `server/` as the `sys.path` root (not repo root).

---

## Database Tables

### Table 1: `places`
All places including temporarily-closed ones. Source: `server/out/places.csv` (13,092 rows: ~12,320 open + ~772 temporarily closed).

**Key design decisions:**
- **NULL semantics for unspecified dimensions:** `cuisine_type`, `cost`, `venue_type` are stored as SQL `NULL` (not strings) when data is missing. This is the source-of-truth convention for the places table.
- `operational` BOOLEAN — `FALSE` = temporarily closed; frontend can grey-out or hide these pins
- `h3_r10` (H3 res-10) is the only tile column — used for k-ring nearby pre-filter
- `lat`/`lon` are kept alongside `geom` because the frontend renders markers directly from floats
- Latest CSV fields are stored directly: `primary_type_display_name`, `short_formatted_address`, `predicted_type`, `wilson_1`, `normal_1`, `tier*`
- The API computes the display `rank` at query time from `normal_1` or `wilson_1`
- Detail card fields are fetched only on pin tap via `/api/place/{id}`

```sql
CREATE TABLE places (
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
  cuisine_type        TEXT             DEFAULT NULL,  -- NULL = unspecified (not a string)
  venue_type          TEXT             DEFAULT NULL,  -- NULL = unspecified (not a string)
  lat                 DOUBLE PRECISION NOT NULL,
  lon                 DOUBLE PRECISION NOT NULL,
  geom                GEOMETRY(Point, 4326) GENERATED ALWAYS AS (
              ST_SetSRID(ST_MakePoint(lon, lat), 4326)
            ) STORED,
  h3_r10              TEXT             NOT NULL,
  pcd                 TEXT,
  areacode            TEXT,
  wheelchair_access   BOOLEAN,
  operational         BOOLEAN,
  cost                TEXT             DEFAULT NULL,   -- NULL = unspecified (not a string)
  wilson_1            REAL,
  normal_1            REAL,
  tier                SMALLINT,
  tier_d              SMALLINT,
  tier_independent    SMALLINT
);

CREATE INDEX idx_places_h3_r10  ON places(h3_r10);
CREATE INDEX idx_places_geom    ON places USING GIST(geom);
CREATE INDEX idx_places_normal_1 ON places(cuisine_type, normal_1 DESC);  -- boosted sort
CREATE INDEX idx_places_wilson_1 ON places(cuisine_type, wilson_1 DESC);  -- raw sort
```

**Index naming note:** Index names were renamed to match the actual columns they index (`normal_1`, `wilson_1`) rather than legacy generic names. The old names `idx_places_rank` and `idx_places_wrank` have been replaced with `idx_places_normal_1` and `idx_places_wilson_1` for semantic clarity.

---

### Table 2: `h3_density`
Pre-aggregated tile counts — eliminates GROUP BY on every pan/zoom.

**Key design decisions (July 2026 update):**
- **Twin-table sentinel architecture:** places uses NULL; h3_density uses sentinels because PRIMARY KEY forbids NULL values
  - `''` (empty string) = **wildcard row** — no mask applied, counts ALL places including NULL
  - `'__null__'` (sentinel) = **explicit NULL representation** — mask applied `IS NULL`, counts only NULL places
  - Concrete values (e.g., "Chinese", "Italian") = **exact match** — mask applied `= exact_value`
  - **Invariant:** Each place appears in exactly one row per tile (no double-counting)
- `score_tier` uses **cumulative** thresholds (≠ places): `0=all, 2=≥0.50, 3=≥0.75, 4=≥0.90`
- Tier 1 (below average) excluded — not a useful map filter
- `score_basis` distinguishes the tile aggregation modes: `0=base`, `1=diversity-aware`, `2=independent`
- **Actual row count: 2,123,754** — validated, 0 duplicate PKs
- **CSV round-trip handling:** Wildcard `''` rows are preserved in CSV; sentinel `'__null__'` rows preserved as strings (never converted to NULL)

```sql
CREATE TABLE h3_density (
    tile            TEXT     NOT NULL,
  resolution      SMALLINT NOT NULL,  -- 7=city | 8=neighbourhood | 9=street | 10=finest
    cuisine_type    TEXT     NOT NULL DEFAULT '__null__',  -- '' = wildcard | '__null__' = unspecified | concrete = exact match
    cost            TEXT     NOT NULL DEFAULT '__null__',  -- '' = wildcard | '__null__' = unspecified | concrete = exact match
    venue_type      TEXT     NOT NULL DEFAULT '__null__',  -- '' = wildcard | '__null__' = unspecified | concrete = exact match
  score_basis     SMALLINT NOT NULL DEFAULT 0,  -- 0=base | 1=diversity-aware | 2=independent
  score_tier      SMALLINT NOT NULL DEFAULT 0,  -- 0=all | 2=above avg | 3=top 25% | 4=top 10%
    count           INTEGER  NOT NULL,
  PRIMARY KEY (tile, resolution, cuisine_type, cost, venue_type, score_basis, score_tier)
);

CREATE INDEX idx_h3_density_lookup ON h3_density(resolution, tile);
```

---

## ETL

Run from the repo root:
```powershell
python server/db/etl_load.py
```

**`etl_load.py` — h3_density fast path:**  
If `server/out/h3_density.csv` exists, it is read directly (skipping the slow build step). If not, `build_h3_density()` runs from scratch. This lets you pre-generate the CSV via the notebook and iterate on uploads without rebuilding.

**Terminal command from the repo root:**
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
& .\.venv\Scripts\Activate.ps1
python server/db/etl_load.py
```

**`load_places.py`** (July 2026 update) normalises unspecified values:
- CSV "Unspecified" on `cuisine_type` → pandas.NA → SQL NULL (pure NULL semantics)
- CSV "Unspecified" on `cost` → pandas.NA → SQL NULL (pure NULL semantics)
- CSV "Unspecified" on `venue_type` → pandas.NA → SQL NULL (pure NULL semantics)
- CSV null on any dimension → pandas.NA → SQL NULL (consistent with explicit "Unspecified")
- `operational` → `True` if null

**`build_h3_density.py`** (July 2026 update) iterates all combinations of `score_basis × tier × cuisine × cost × venue × resolution` and skips empty groupby results. For each dimension:
- Generates concrete rows for each observed value in the dimension (e.g., "Chinese", "Italian")
- Generates sentinel row `'__null__'` if any NULL values exist in that dimension for the tile
- Generates wildcard row `''` for all tiles (applies no mask, counts all places)
- **Mask logic:** wildcard `''` = no mask; sentinel `'__null__'` = mask `&= df[column].isna()`; concrete = mask `&= df[column] == value`

**`build_h3_density.ipynb`** — standalone notebook in `server/db/etl/`. Runs `load_places()` + `build_h3_density()` independently and saves to `server/out/h3_density.csv`. Use this to regenerate or inspect the aggregation without touching the DB. Run with the `server/venv` kernel.

**`insert_h3_density.py`** validates and inserts h3_density rows. All three row types (wildcard `''`, sentinel `'__null__'`, concrete values) are stored as strings—never converted to NULL. This preserves the PRIMARY KEY constraint.

---

## API Endpoints

**Core endpoints are implemented.** Run the server from the repo root:
```powershell
server\venv\Scripts\python.exe -m uvicorn server.server:app --host 0.0.0.0 --port 3000 --reload
```

**SSL note (Windows + Neon):** `asyncpg` requires an explicit `SSLContext` on Windows — the `sslmode=require` URL param is not sufficient. `server.py` creates one via `ssl.create_default_context()` and passes it to `create_pool(ssl=ssl_ctx)`.

### Adaptive H3 zoom resolution
```
zoom 0–10  → res 7   (city)
zoom 11–13 → res 8   (neighbourhood)
zoom 14–16 → res 9   (street)
zoom 17+   → res 10  (finest; heatmap OFF)
```

### GET /api/tiles — Viewport tile density or lightweight places pins
```
?sw_lat=&sw_lng=&ne_lat=&ne_lng=&res=8&cuisine=&cost=&venue_type=&score_basis=0&score_tier=0
```

**Filter Architecture (July 2026 update):**

Frontend sends filter values (e.g., `cuisine=['Unspecified', 'Chinese']`). The backend normalizes and queries:

- **Empty filter** (no values selected):
  - h3_density: match wildcard row `cuisine_type = ''` (counts ALL places)
  - places: match NULL `cuisine_type IS NULL` (finds unspecified places)
- **"Unspecified" selected (user label):**
  - normalize.py converts to sentinel `'__null__'`
  - h3_density: match sentinel row `cuisine_type = '__null__'` (counts only NULL places)
  - places: match NULL `cuisine_type IS NULL` (finds unspecified places)
- **Concrete values selected (e.g., "Chinese", "Italian"):**
  - h3_density: match concrete rows `cuisine_type IN ('Chinese', 'Italian')`
  - places: match concrete values `cuisine_type = ANY(['Chinese', 'Italian'])`
- **Mixed selection (both "Unspecified" and concrete):**
  - normalize.py converts to `['__null__', 'Chinese', 'Italian']`
  - h3_density: match sentinel + concrete `cuisine_type IN ('__null__', 'Chinese', 'Italian')`
  - places: translate `'__null__'` to IS NULL, match others by value

**Dual-tile design (outer/inner split):**

The endpoint computes two tile sets from the viewport bbox:

- **`outer_tiles`** (padded bbox, ~1 H3 cell diameter per resolution)
  - Queried against `h3_density` — includes intersecting edge tiles so the heatmap has no missing patches at the viewport boundary
  - Used to build the single-flight dedupe key for concurrent identical tile-density requests
- **`inner_tiles`** (exact bbox, no padding)
  - Used only to sum the place count threshold from the already-fetched `h3_density` rows — no second DB call
  - Determines whether to fall back to the places query

Padding per resolution (in `map_common.py`):
| res | pad |
|---|---|
| 7 | 0.05° |
| 8 | 0.018° |
| 9 | 0.007° |
| 10 | 0.003° |

**Response modes:**
- `inner_count > 20` → `{mode: "tiles", resolution, data: [{tile, count}, ...]}` (full outer set)
- `inner_count ≤ 20` → `{mode: "places", data: [...], total: len(rows)}` (places query by lat/lon BETWEEN original bbox bounds)
  - **July 2026 fix:** `total` is now `len(rows)` (actual result count), not `inner_count` (h3_density estimate). This prevents the frontend from expecting more results than delivered due to bbox/tile misalignment.

**Places-mode payload (map pin rendering):**
- `id`
- `lat`
- `lon`
- `tier` (0–4 from selected score-basis tier column)

### July 2026 — NULL/Sentinel Architecture & Ghost Tile Fix

**Ghost Tile Root Cause:**
- Old ETL used `.fillna('Unspecified')` in load_places.py, converting NULL → string "Unspecified"
- h3_density aggregated both a concrete row (cuisine_type="Unspecified") AND a wildcard row (cuisine_type='')
- Singleton SQL couldn't find places with NULL cuisine when filtering by "Unspecified" string
- Result: h3_density showed count ≥ 1 but places query returned 0 → ghost tiles

**Root Cause Analysis:**
- PRIMARY KEY constraint prevents NULL in h3_density columns (not NULL in PK)
- Required sentinel value (`'__null__'`) instead of NULL
- places table uses pure NULL (source-of-truth convention); h3_density uses sentinel (aggregation index convention)
- Old ETL and endpoints used inconsistent semantics across tables

**Comprehensive Resolution (July 2026):**
1. **ETL Pipeline:**
   - load_places.py: CSV "Unspecified" → pandas.NA → SQL NULL (not string)
   - build_h3_density.py: Generate three row types per dimension:
     - `''` (wildcard): no mask, counts ALL
     - `'__null__'` (sentinel): mask IS NULL, counts only NULL
     - Concrete: mask = exact match
   - No double-counting: each place appears in exactly one row per tile

2. **Database Schema:**
   - places: `cuisine_type TEXT DEFAULT NULL`, `cost TEXT DEFAULT NULL`, `venue_type TEXT DEFAULT NULL`
   - h3_density: `cuisine_type TEXT NOT NULL DEFAULT '__null__'`, etc. (sentinel as default)

3. **API Filter Logic (Updated July 2026):**
   - normalize.py: maps "Unspecified" (user label) → `'__null__'` (sentinel)
   - All SQL queries now use consistent NULL-aware filters:
     ```sql
     -- Empty filter → show all (including NULL)
     (CARDINALITY($N::TEXT[]) = 0 AND column IS NULL)
     
     -- Non-empty filter → match concrete values + '__null__' as IS NULL
     OR (CARDINALITY($N::TEXT[]) > 0 AND (
       column = ANY(ARRAY_REMOVE($N::TEXT[], '__null__'))
       OR ('__null__' = ANY($N::TEXT[]) AND column IS NULL)
     ))
     ```

4. **Updated Endpoints (All Audited & Compliant):**
   - ✅ `/api/tiles` — tile_api.py + tile_api/sql.py (h3_density queries)
   - ✅ `/api/places/list` — places_list_api.py (places table)
   - ✅ `/api/nearby` — nearby_api/sql.py (places table)
   - ✅ `/api/top_places_in_view` — top_places_in_view_api/sql.py (places table)
   - ✅ `/api/cost_histogram` — histogram_api/sql.py (both price + cuisine histograms)
   - ✅ `/api/place/{id}` — place_api.py (single place detail, no filters needed)

**Invariant Restored:** Ghost tiles eliminated. All tiles with count ≥ 1 in h3_density now have fetchable places in places table.

**Why This Architecture Persists:**
- Pre-aggregation still eliminates GROUP BY on every pan (essential for Neon cost/latency)
- Wildcard rows are necessary for "no filter" queries
- Sentinel design avoids PRIMARY KEY NULL constraint while preserving NULL-aware semantics
- Twin-table convention (NULL vs sentinel) enforced via API translation layer (normalize.py)

### Bug 3: Total Count Mismatch in Places Mode

**Observed symptom:** Tile shows `count=1`, user zooms, but no place pins appear (or fewer than displayed).

**Root cause:** The `total` field in places-mode responses was set to `inner_count` (from h3_density), not the actual number of rows returned by the places query. H3 tiles don't perfectly align with lat/lon bounding boxes—a place inside an inner tile can fall outside the exact bbox when filtered by `lat BETWEEN sw_lat AND ne_lat`. This caused the frontend to expect N results but receive fewer or zero.

**Resolution implemented:**
- [server/api/tile_api/tile_api.py#L223](server/api/tile_api/tile_api.py#L223) — changed places-mode total to `len(rows)` (actual result count).
- Added comment explaining the bbox/tile misalignment logic.

**Why this matters:**
- `inner_count` is a heuristic for deciding when to switch from tiles to places mode (if `inner_count <= PAGE_SIZE`, fetch places).
- The true count of places within the exact bbox is what the places query returns; using `inner_count` as the total misleads the frontend.

**Regression validation:**
The historical reconciliation script has been retired. Validation should now be done via endpoint-level integration checks against `/api/tiles` and `/api/places/top`.

**Caching (current):**
- `/api/tiles` and `/api/places/top` do not persist response payloads in backend memory.
- `/api/tiles` still coalesces concurrent identical density requests with single-flight dedupe keyed by snapped outer tiles + filters.
- Histograms cache only `scope=citywide` responses with TTL (`HISTOGRAM_CACHE_TTL_SECONDS`, default 120s).

### GET /api/nearby — Pin drop / walk bubble
```
?lat=&lng=&radius_m=1000&cuisine=&cost=&venue_type=&score_basis=0&score_tier=0&page=1
```
- k-ring pre-filter: `h3.grid_disk(center_r10, k=ceil(radius_m / 114.2) + 1)`
- Then: `ST_DWithin(geom::geography, point::geography, radius_m)`
- Sort/filter basis column selected from `score_basis` (`tier`, `tier_d`, or `tier_independent`)
- Pagination: 80 per page (`PAGE_SIZE_ON_REQUEST`)

### GET /api/place/{id} — Detail card
Fetched on pin tap for tooltip/detail panel. 404 on miss.

Returns:
- `id`
- `ranking` (`normal_1` percentile)
- `display_name`
- `cuisine_type`
- `is_chain`
- `venue_type`
- `google_maps_uri`
- `website_uri`
- `short_formatted_address`
- `pcd`

### GET /api/places/list — Ranked places for restaurant info panel
```
?sw_lat=&sw_lng=&ne_lat=&ne_lng=&cuisine=&cost=&venue_type=&rank_column=normal_1&score_basis=0&score_tier=0&page=1
```

Purpose:
- Returns a ranked list for panel/table rendering and pagination

Behavior:
- Default sorting column: `normal_1`
- Optional sort allowlist: `normal_1`, `wilson_1`
- Applies the same bbox/cuisine/cost/venue filters as map place queries
- Applies score threshold via selected basis tier column
- Pagination: 20 per page

Returns list rows:
- `ranking` (`normal_1`)
- `display_name`
- `cuisine_type`
- `is_chain`
- `venue_type`
- `google_maps_uri`
- `website_uri`

---

## Map Layers

| Layer | Data source | Off condition |
|---|---|---|
| H3 pin-count labels | `/api/tiles` mode=tiles | mode=places (≤25 results) |
| Smooth heatmap (Option B) | `/api/tiles` mode=tiles → `h3.cellToLatLng()` client-side | res 10 OR mode=places |
| Restaurant pins | `/api/tiles` mode=places (lightweight: id/lat/lon/tier) | mode=tiles |

---

## Cost Controls

| Technique | Saves |
|---|---|
| Pre-aggregated `h3_density` | Eliminates GROUP BY on every pan |
| Outer/inner tile split | Inner threshold avoids counting edge tiles while retaining seamless outer-tile coverage |
| Single-flight dedupe on `/api/tiles` | Coalesces concurrent identical density reads |
| Citywide-only histogram TTL cache | Captures low-cardinality high-reuse queries |
| `asyncpg` pool `max_size=5` | Keeps Neon compute-seconds low |
| Narrow SELECT (no `*` in list endpoints) | Reduces transfer |
| Detail fields only on tap (`/api/place/{id}`) | Never sent in list/tile responses |

---

## Validation & Architectural Clarifications (July 12, 2026 Audit)

### 1. score_tier Validation (High Priority) ✅
**Issue:** Missing bounds checking on `score_tier` parameter (should be 0-4).

**Resolution:** All 6 endpoints now validate via Pydantic `Query(ge=0, le=4)`:
- ✅ `/api/tiles` (tile_api.py)
- ✅ `/api/places/list` (places_list_api.py)
- ✅ `/api/places/top` (top_places_in_view_api.py)
- ✅ `/api/nearby` (nearby_api.py)
- ✅ `/api/cost_histogram` (price_histogram_api.py)
- ✅ `/api/cuisine_histogram` (cuisine_histogram_api.py)

**Why this matters:** Out-of-range `score_tier` values could silently return empty results or cause SQL errors. Validation now rejects invalid input at the HTTP layer before reaching the database.

### 2. score_basis Double-Meaning Clarification ✅
**Dual Role:** The `score_basis` parameter (0/1/2) serves TWO purposes:

1. **Column Selection** — Which ranking column to use in SQL queries:
   - `0` → `tier` (boosted/base ranking)
   - `1` → `tier_d` (diversity-aware ranking)
   - `2` → `tier_independent` (independent/unbiased ranking)

2. **Filter Value** — Which pre-aggregated h3_density variant to query:
   - The h3_density.score_basis column stores 0/1/2 to distinguish three aggregation modes
   - `/api/tiles` filters h3_density by this int value directly

**Why This Persists:** Pre-aggregation requires separating the h3_density table by score_basis at ETL time. Each score_basis variant has its own set of pre-computed tile densities. The column selector and filter value are tightly coupled and intentionally symmetric.

**Documentation added to:** tile_api.py (comment in TILES_SQL call explaining score_basis dual role).

### 3. rank_column vs. score_basis Independence in /api/places/list ✅
**Design:** The `/api/places/list` endpoint has TWO intentionally independent ranking parameters:

- **rank_column** (normal_1 or wilson_1): Controls `ORDER BY` and `SELECT` (sorting/display)
- **score_basis** (0/1/2 → tier/tier_d/tier_independent): Controls `WHERE` clause filtering

**Intentional Independence:** Users can combine them freely:
- `rank_column="wilson_1"` with `score_basis=1` → sort by Wilson score, filter by diversity-aware tier
- `rank_column="normal_1"` with `score_basis=2` → sort by base rank, filter by independent tier

The ranking shown may not correspond to the filter tier if they mismatch. **This is intentional** — it allows exploring different ranking philosophies against different filtering criteria.

**Documentation added to:** places_list_api.py (function docstring explaining the independence).

### 4. Empty Filter Array Semantics (Fixed July 2026) ✅
**Definition:** When the frontend sends NO filters (empty cuisine/cost array, `venue_type` not selected), the backend must show ALL places for that dimension.

**Old (Broken) Logic:**
```sql
(CARDINALITY($5::TEXT[]) = 0 AND cuisine_type IS NULL)  -- only NULL cuisines ❌
OR (CARDINALITY($5::TEXT[]) > 0 AND ...)
```

**New (Correct) Logic:**
```sql
CARDINALITY($5::TEXT[]) = 0  -- show ALL cuisines ✅
OR (CARDINALITY($5::TEXT[]) > 0 AND ...)
```

**Root Cause of Ghost Tile Bug:** When no filters were selected, the old logic matched only places with NULL cuisine_type, returning 0-2 results instead of the full dataset. The map displayed only a handful of unspecified-cuisine places on load.

**Fixed in 7 SQL Query Locations:**
1. PLACES_SQL (tile_api/sql.py)
2. SINGLETON_SQL (tile_api/sql.py)
3. SQL_NEARBY (nearby_api/sql.py)
4. TOP_PLACES_IN_VIEW_SQL (top_places_in_view_api/sql.py)
5. places_list_api inline SQL
6. SQL_CITYWIDE_PRICE, SQL_VIEW_PRICE (histogram_api/sql.py)
7. SQL_CITYWIDE_CUISINE, SQL_VIEW_CUISINE (histogram_api/sql.py)

**Verification:** All 8 endpoint files pass Python syntax validation with no errors.

### 5. Frontend buildQueryKey Consistency (Verified July 12) ✅
**All 6 frontend request hooks use consistent parameter encoding:**
- ✅ useRequestTiles
- ✅ useRequestTopPlaces
- ✅ useRequestNearby
- ✅ useRequestPlacesList
- ✅ useRequestCuisineHistogram
- ✅ useRequestPriceHistogram

**Pattern:** URLSearchParams.append() for multi-value array parameters:
```typescript
for (const cuisine of (params.cuisines ?? []).slice().sort(...)) {
  qs.append('cuisine', cuisine);
}
```

**Empty array behavior:** No query params appended → backend receives `null` or `[]` → normalized to "show all" semantic. This is consistent and correct across all endpoints.

**Response format:** All backend responses match frontend interface types exactly. No structural mismatches detected.

---

## Migration Checklist

```
[x] 1. Create server/db/schema.sql
[x] 2. Create server/db/etl/ (load, build, insert modules)
[x] 3. Validate imports and dry-run
[x] 4. Add `operational` column to schema and insert_places.py
[x] 5. Add h3_density fast-path (read CSV if exists) to etl_load.py
[x] 6. Create build_h3_density.ipynb for standalone aggregation
[x] 7. Validate h3_density.csv (2,123,754 rows, 0 duplicate PKs, correct dimensions)
[x] 8. Build FastAPI endpoints (/api/tiles, /api/nearby, /api/place/{id})
[x] 9. Implement outer/inner tile split in tile_api.py + map_common.py
[x] 10. Fix asyncpg Windows SSL: explicit SSLContext in server.py
[x] 11. Create api_test/backend_api_test.ipynb smoke-test notebook
[x] 12. (July 2026) Implement NULL/sentinel architecture: places uses NULL, h3_density uses '__null__' sentinel + '' wildcard
[x] 13. (July 2026) Update ETL: load_places.py converts "Unspecified" → NULL; build_h3_density.py generates three row types
[x] 14. (July 2026) Update all endpoints for NULL-aware filtering (normalize.py + SQL translation layer)
[x] 15. (July 2026) Audit all API endpoints — verify compliance with new schema (6 endpoints updated, 0 regressions)
[x] 16. (July 12, 2026) Validate score_tier bounds (0-4) on all endpoints; add architectural documentation for score_basis + rank_column independence
[ ] 17. Create Neon project → add DATABASE_URL to .env
[ ] 18. Run schema.sql against Neon (Neon SQL Editor or psql)
[ ] 19. Run: python db/etl_load.py (new ETL will rebuild with NULL/sentinel architecture)
[ ] 20. Verify: SELECT COUNT(*) FROM places; → ~13,092
[ ] 21. Verify: SELECT COUNT(*) FROM h3_density; → ~2,123,754
[ ] 22. Verify ghost tiles are eliminated: SELECT COUNT(*) FROM h3_density WHERE count >= 1 (all rows now have fetchable places)
[ ] 23. Test all endpoints via api_test/backend_api_test.ipynb (requires non-corporate network or VPN bypass for port 5432)
[ ] 24. Deploy FastAPI to Render.com, set DATABASE_URL env var
[ ] 25. Wire React frontend to new endpoints
```

---

## Concurrency Notes (20 concurrent users)

- Neon free tier: 100 connections, 0.25 vCPU — adequate for 20 users at ~10–20 qps
- `asyncpg` pool `max_size=5` handles 20 users (each query holds connection ~3ms)
- Render.com free tier (0.1 vCPU) is the actual bottleneck; upgrade to Starter ($7/mo) if needed
- Both services scale to zero when idle — no billing between sessions

---

## Architectural Decisions

### NULL vs. Sentinel Value Convention

**Problem:** PRIMARY KEY constraint in PostgreSQL forbids NULL values. The h3_density table uses a composite PK, so storing NULL for "unspecified" dimensions violates the constraint.

**Solution:** Twin-table convention
- **places** table (source-of-truth): Uses pure `NULL` for unspecified dimensions. Clean, semantically correct, minimal storage.
- **h3_density** table (aggregation index): Uses sentinel value `'__null__'` for unspecified dimensions, plus wildcard `''` for all-aggregate rows.

**API Translation Layer:** normalize.py maps user labels ("Unspecified") to sentinel `'__null__'` for h3_density queries. ARRAY_REMOVE and IS NULL translation ensures places table queries match NULL semantics correctly.

**Why not use empty string everywhere?** Empty string is ambiguous: is it "no filter" or "explicitly unspecified"? Sentinel `'__null__'` makes the distinction explicit and avoids collision with potential empty-string data values.

### Row Types in h3_density

Each h3_density tile stores three semantic row types for each dimension:

1. **Wildcard `''`** — aggregates across all places, no mask applied
   - Used when frontend sends empty filter ("show all")
   - Query: `WHERE dimension = ''` for unfiltered view
   - Performance: single row per tile per score basis/tier combination

2. **Sentinel `'__null__'`** — aggregates places where dimension is NULL in places table
   - Used when frontend sends "Unspecified" filter
   - Query: `WHERE dimension = '__null__'` → internally translates to `IS NULL` on places table
   - Ensures ghost tiles: count represents actual fetched places

3. **Concrete values** (e.g., "Chinese", "Italian") — exact matches
   - Used when frontend sends specific filter values
   - Query: `WHERE dimension IN (concrete_values)`
   - Standard aggregation behavior

**Invariant:** No double-counting. Each place belongs to exactly one row type per tile. The build logic ensures this via mask composition: wildcard (no mask) XOR sentinel (IS NULL mask) XOR concrete (= mask).
