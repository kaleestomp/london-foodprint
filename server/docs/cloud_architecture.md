# London Foodprint — Cloud Architecture Design
**Last updated:** June 15, 2026  
**Status:** Schema rebuilt for the updated places export. ETL loader updated. All three API endpoints built.

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
      tile_cache.py         ← in-process TTL cache (default 60s, env-configurable)
      places_query/         ← reference/notes on places fallback query variants
    place_api.py            ← GET /api/place/{id}
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
  cuisine_type        TEXT,
  venue_type          TEXT,
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
  cost                TEXT,
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

**Key design decisions:**
- `score_tier` uses **cumulative** thresholds (≠ places): `0=all, 2=≥0.50, 3=≥0.75, 4=≥0.90`
- Tier 1 (below average) excluded — not a useful map filter
- `score_basis` distinguishes the two tile aggregation modes: `0=base`, `1=diversity-aware`, `2=independent`
- `''` for any TEXT dimension = "all" (unfiltered aggregate)
- **Actual row count: 2,123,754** — validated, 0 duplicate PKs
- **CSV round-trip gotcha**: `''` wildcard rows are written as blank cells in CSV and read back as `NaN` by pandas. `etl_load.py` applies `.fillna("")` on the three TEXT dimension columns after `pd.read_csv()` before any insert. Neon columns are `NOT NULL` so skipping this step causes a null constraint violation.

```sql
CREATE TABLE h3_density (
    tile            TEXT     NOT NULL,
  resolution      SMALLINT NOT NULL,  -- 7=city | 8=neighbourhood | 9=street | 10=finest
    cuisine_type    TEXT     NOT NULL DEFAULT '',
    cost            TEXT     NOT NULL DEFAULT '',
    venue_type      TEXT     NOT NULL DEFAULT '',
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

**`load_places.py`** normalises nulls in source data:
- `cuisineType` → `"Unspecified"` if null
- `venueType` → `"Dine-In"` if null  
- `cost` → `"Unspecified"` if null
- `operational` → `True` if null

**`build_h3_density.py`** iterates all combinations of `score_basis × tier × cuisine × cost × venue × resolution` and skips empty groupby results. Appends `""` to each dimension list as the wildcard ("show all") value.

**`build_h3_density.ipynb`** — standalone notebook in `server/db/etl/`. Runs `load_places()` + `build_h3_density()` independently and saves to `server/out/h3_density.csv`. Use this to regenerate or inspect the aggregation without touching the DB. Run with the `server/venv` kernel.

**`insert_h3_density.py`** deduplicates on PK columns before insert as a safety net against any upstream dimension list collisions.

---

## API Endpoints

**All three endpoints are implemented.** Run the server from the repo root:
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

### GET /api/tiles — Viewport tile density
```
?sw_lat=&sw_lng=&ne_lat=&ne_lng=&res=8&cuisine=&cost=&venue_type=&score_basis=0&score_tier=0
```

**Dual-tile design (outer/inner split):**

The endpoint computes two tile sets from the viewport bbox:

- **`outer_tiles`** (padded bbox, ~1 H3 cell diameter per resolution)
  - Queried against `h3_density` — includes intersecting edge tiles so the heatmap has no missing patches at the viewport boundary
  - Used as the cache key (more stable across small pans; a pan smaller than the pad doesn't change `outer_tiles` → cache hit)
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
- `inner_count ≤ 20` → `{mode: "places", data: [...], total: inner_count}` (places query by lat/lon BETWEEN original bbox bounds)

### June 2026 Tile Count Consistency Fix (incident + resolution)

**Symptom observed:** a density pin could show a larger count than the number of place pins seen after zooming in (for example, `8` on a tile collapsing to `1` place).

**Root cause:**
- `h3_density` intentionally stores wildcard aggregate rows (`cuisine_type=''`, `cost=''`, `venue_type=''`) alongside concrete dimension rows.
- The previous SQL predicate logic could include both wildcard and concrete rows in the same query path, causing over-summed tile counts.

**Resolution implemented:**
- `/api/tiles` now enforces a strict dimension contract in `_TILES_SQL`:
  - no filter on a dimension → select wildcard row only (`dimension=''`)
  - active filter on a dimension → select concrete matching rows only (`dimension IN (...)`)
- Venue now follows the same explicit rule through exact match (`venue_type = $5`) where frontend sends `''` when unfiltered.
- Cache scope is now split by payload type:
  - `tiles` cache key remains based on padded `outer_tiles` + filters (high hit rate on small pans)
  - `places` cache key is independent and includes exact bbox bounds (prevents stale mode or stale viewport place lists)
- Added code comments in `tile_api.py`, schema comments in `schema.sql`, and ETL notes in `build_h3_density.py` to make this invariant explicit and prevent regressions.

**Why this architecture remains correct:**
- Pre-aggregation is still preferred for pan/zoom latency and Neon cost control.
- The bug was not caused by pre-aggregation itself, but by ambiguous query semantics over mixed wildcard + concrete rows.
- Keeping wildcard rows is acceptable as long as queries always choose one semantic set per dimension.

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
A reconciliation script validates that tile counts are internally consistent. Run it manually to verify deployed queries:
```powershell
python server/api_test/reconcile_tiles_places.py
```
Checks two invariants:
1. `inner_count` from tiles query closely matches the actual place query result (sanity bound: ±10%).
2. Mode switch is deterministic: `inner_count > PAGE_SIZE` → tiles mode, else → places mode.

Exit code 0 = pass, 1 = fail (see stdout for details).

**Cache:** 60s in-process TTL (`tile_cache.py`, env var `TILES_CACHE_TTL_SECONDS`).
- `tiles` responses use cache key: sorted `outer_tiles` + all filter dimensions.
- `places` responses use a separate cache key that also includes exact viewport bbox (`sw_lat/sw_lng/ne_lat/ne_lng`).

### GET /api/nearby — Pin drop / walk bubble
```
?lat=&lng=&radius_m=1000&cuisine=&cost=&venue_type=&score_basis=0&rank_threshold=0&page=1
```
- k-ring pre-filter: `h3.grid_disk(center_r10, k=ceil(radius_m / 114.2) + 1)`
- Then: `ST_DWithin(geom::geography, point::geography, radius_m)`
- Sort: `ORDER BY rank_1 DESC` (boosted) or `wrank_1` (raw Wilson), selected by `score_basis`
- Pagination: 20 per page

### GET /api/place/{id} — Detail card
Full metadata including all rank scores, address, website, wheelchair access. 404 on miss. Fetched only on pin tap.

---

## Map Layers

| Layer | Data source | Off condition |
|---|---|---|
| H3 pin-count labels | `/api/tiles` mode=tiles | mode=places (≤25 results) |
| Smooth heatmap (Option B) | `/api/tiles` mode=tiles → `h3.cellToLatLng()` client-side | res 10 OR mode=places |
| Restaurant pins | `/api/tiles` mode=places | mode=tiles |

---

## Cost Controls

| Technique | Saves |
|---|---|
| Pre-aggregated `h3_density` | Eliminates GROUP BY on every pan |
| Outer/inner tile split | outer_tiles cache key absorbs small pans; inner_count threshold avoids counting edge tiles |
| 60s TTL in-process cache on `/api/tiles` | Absorbs repeated pans |
| Cache key uses sorted outer_tiles | Deterministic across viewport jitter |
| `asyncpg` pool `max_size=5` | Keeps Neon compute-seconds low |
| Narrow SELECT (no `*` in list endpoints) | Reduces transfer |
| Detail fields only on tap (`/api/place/{id}`) | Never sent in list/tile responses |

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
[x] 8. Fix CSV round-trip NaN: etl_load.py applies .fillna('') on dimension columns after pd.read_csv()
[x] 9. Build FastAPI endpoints (/api/tiles, /api/nearby, /api/place/{id})
[x] 10. Implement outer/inner tile split in tile_api.py + map_common.py
[x] 11. Fix asyncpg Windows SSL: explicit SSLContext in server.py
[x] 12. Create api_test/backend_api_test.ipynb smoke-test notebook
[ ] 13. Create Neon project → add DATABASE_URL to .env
[ ] 14. Run schema.sql against Neon (Neon SQL Editor or psql)
[ ] 15. Run: python db/etl_load.py
[ ] 16. Verify: SELECT COUNT(*) FROM places; → ~13,092
[ ] 17. Verify: SELECT COUNT(*) FROM h3_density; → ~2,123,754
[ ] 18. Test all endpoints via api_test/backend_api_test.ipynb (requires non-corporate network or VPN bypass for port 5432)
[ ] 19. Deploy FastAPI to Render.com, set DATABASE_URL env var
[ ] 20. Wire React frontend to new endpoints
```

---

## Concurrency Notes (20 concurrent users)

- Neon free tier: 100 connections, 0.25 vCPU — adequate for 20 users at ~10–20 qps
- `asyncpg` pool `max_size=5` handles 20 users (each query holds connection ~3ms)
- Render.com free tier (0.1 vCPU) is the actual bottleneck; upgrade to Starter ($7/mo) if needed
- Both services scale to zero when idle — no billing between sessions
