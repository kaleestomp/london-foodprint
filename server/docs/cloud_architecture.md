# London Explorer — Cloud Architecture Design
**Date:** June 9, 2026  
**Status:** Design complete, not yet implemented

---

## Platform Choice

| Layer | Service | Reason |
|---|---|---|
| Cloud SQL | **Neon** (serverless PostgreSQL) | Scales to zero, free tier (0.5 GB / 191 compute-hrs/month), no billing surprise |
| Backend hosting | **Render.com** free tier | Also scales to zero; pairs with Neon |
| Backend framework | **FastAPI** + `asyncpg` | Already in use in `server/server.py` |
| Frontend | React (existing) | Unchanged |

**Alternative:** Supabase instead of Neon if auto-generated REST or realtime is needed later. For pure FastAPI backend, Neon is leaner.

---

## Database Schema

### Extensions
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS h3;   -- h3-pg
```

---

### Table 1: `places`
One row per restaurant. Source: `server/out/places.csv`

```sql
CREATE TABLE places (
    id                       TEXT PRIMARY KEY,
    display_name             TEXT NOT NULL,
    primary_type_display_name TEXT,
    lat                      DOUBLE PRECISION NOT NULL,
    lon                      DOUBLE PRECISION NOT NULL,
    geom                     GEOMETRY(Point, 4326) GENERATED ALWAYS AS (
                               ST_SetSRID(ST_MakePoint(lon, lat), 4326)
                           ) STORED,
    h3_res9                  TEXT NOT NULL,
    h3_res10                 TEXT NOT NULL,
    types                    TEXT,
    primary_type             TEXT,
    cuisine_type             TEXT,
    venue_type               TEXT,
    predicted_type           TEXT,
    price_band               TEXT,                   -- '<20' | '<50' | '<100' | '100+'
    cost                     TEXT,
    is_chain                 BOOLEAN,
    wheelchair_access        BOOLEAN,
    operational              BOOLEAN,
    rating                   REAL,
    user_rating_count        INTEGER,
    p_local                  REAL,
    competition_factor       REAL,
    representations          INTEGER,
    wilson_0                 REAL,
    normal_0                 REAL,
    wilson_1                 REAL,
    normal_1                 REAL,
    wilson_2                 REAL,
    normal_2                 REAL,
    boosted_0                REAL,
    bnormal_0                REAL,
    boosted_1                REAL,
    bnormal_1                REAL,
    boosted_2                REAL,
    bnormal_2                REAL,
    pcd                      TEXT,
    areacode                 TEXT,
    address                  TEXT,
    google_maps_uri          TEXT,
    website_uri              TEXT
);

CREATE INDEX idx_places_h3_res9      ON places(h3_res9);
CREATE INDEX idx_places_h3_res10     ON places(h3_res10);
CREATE INDEX idx_places_geom         ON places USING GIST(geom);
CREATE INDEX idx_places_cuisine_rank ON places(cuisine_type, bnormal_2 DESC);
```

**Important:** the cloud DB keeps both `h3_res9` and `h3_res10` for filtering.  
Use `h3_res9` for broader viewport queries and `h3_res10` for fine-grain lookups:
```python
# res 9 → res 10 is a FINER resolution: use cell_to_center_child, NOT cell_to_parent.
# cell_to_parent only works going to coarser (lower-numbered) resolutions.
df["h3_res10"] = df["h3_res9"].apply(lambda t: h3.cell_to_center_child(t, 10))
```

---

### Table 2: `h3_density`
Pre-aggregated tile counts — eliminates GROUP BY on every pan/zoom request.

```sql
CREATE TABLE h3_density (
    tile         TEXT     NOT NULL,
    resolution   SMALLINT NOT NULL,   -- 7 | 8 | 9 | 10
    cuisine_type TEXT     NOT NULL DEFAULT '',  -- '' = all cuisines
    price_band   TEXT     NOT NULL DEFAULT '',  -- '' = all prices
    count        INTEGER  NOT NULL,
    PRIMARY KEY (tile, resolution, cuisine_type, price_band)
);

CREATE INDEX idx_h3_density_lookup ON h3_density(resolution, tile);
```

#### Price band mapping (from Google priceLevel)
| Google enum | price_band |
|---|---|
| `PRICE_LEVEL_FREE` | `<20` |
| `PRICE_LEVEL_INEXPENSIVE` | `<20` |
| `PRICE_LEVEL_MODERATE` | `<50` |
| `PRICE_LEVEL_EXPENSIVE` | `<100` |
| `PRICE_LEVEL_VERY_EXPENSIVE` | `100+` |
| `None` / unknown | `''` |

#### ETL aggregation (one-off Python script at ingest)
```python
import h3, itertools, pandas as pd

df = pd.read_csv("server/out/places.csv")
bands    = ["<20", "<50", "<100", "100+", ""]
cuisines = list(df["cuisineType"].unique()) + [""]
rows = []

LOCAL_TILE_RES = 10  # res 10 is the finest per-place tile in the cloud DB

for res in [7, 8, 9, 10]:
    col = f"t{res}"
    # Pass-through for res 10 (already at target res); cell_to_parent for coarser res
    df[col] = df["h3_res10"].apply(
        lambda t, r=res: t if r == LOCAL_TILE_RES else h3.cell_to_parent(t, r)
    )
    for cuisine, band in itertools.product(cuisines, bands):
        mask = pd.Series([True] * len(df))
        if cuisine: mask &= df["cuisineType"] == cuisine
        if band:    mask &= df["price_band"]  == band
        agg = df[mask].groupby(col).size().reset_index(name="count")
        agg["resolution"]   = res
        agg["cuisine_type"] = cuisine
        agg["price_band"]   = band
        rows.append(agg.rename(columns={col: "tile"}))

h3_density_df = pd.concat(rows, ignore_index=True)
# → bulk insert into h3_density
```
Approximate row count: ~5k restaurants × 4 resolutions × 28 cuisines × 5 price bands ≈ **~280k rows** — small.

---

## API Endpoints

### Adaptive H3 Zoom Resolution
```
zoom  0–10  → H3 res 7  (city view)
zoom 11–13  → H3 res 8  (neighbourhood view)
zoom 14–16  → H3 res 9  (street view)
zoom 17+    → H3 res 10 (finest; heatmap switches OFF here)
```

---

### `GET /api/tiles` — Viewport tile density (pan/zoom)
```
?sw_lat=51.47&sw_lng=-0.20&ne_lat=51.56&ne_lng=-0.05&zoom=12&cuisine=Chinese&price=<50
```

```python
@app.get("/api/tiles")
@cache(expire=60)  # 60-second TTL in-process cache
async def get_tiles(sw_lat, sw_lng, ne_lat, ne_lng, zoom, cuisine="", price=""):
    h3_res = zoom_to_h3_res(zoom)
    viewport_tiles = h3.polygon_to_cells(bbox_polygon, h3_res)

    rows = await db.fetch(
        "SELECT tile, count FROM h3_density "
        "WHERE resolution=$1 AND tile=ANY($2) "
        "AND cuisine_type=$3 AND price_band=$4",
        h3_res, list(viewport_tiles), cuisine, price
    )
    total = sum(r["count"] for r in rows)

    if total <= 20:
        # Return actual restaurant records
        places = await db.fetch(
                "SELECT id, display_name, lat, lon, h3_res9, h3_res10, cuisine_type, bnormal_2 "
                "FROM places WHERE (h3_res9 = ANY($1) OR h3_res10 = ANY($1)) "
                "AND ($2='' OR cuisine_type=$2) AND ($3='' OR price_band=$3) "
                "ORDER BY bnormal_2 DESC",
            list(viewport_tiles), cuisine, price
        )
        return {"mode": "places", "data": places}

    return {"mode": "tiles", "data": rows}
```

**Response modes:**
- `"tiles"` → frontend renders pin-count labels at H3 centroids (and heatmap synthetic points)
- `"places"` → frontend renders actual restaurant pins (heatmap layer hides)

---

### `GET /api/nearby` — Pin drop / 1km walk bubble
```
?lat=51.515&lng=-0.072&cuisine=Japanese&price=<50&page=1
```

```python
WALK_RADIUS_M = 1000
PAGE_SIZE = 20

@app.get("/api/nearby")
async def get_nearby(lat, lng, cuisine="", price="", page=1):
    center_tile = h3.latlng_to_cell(lat, lng, 10)  # res 10
    candidate_tiles = h3.grid_disk(center_tile, k=2)  # k-ring covers ~1km at res 10

    offset = (page - 1) * PAGE_SIZE
    rows = await db.fetch("""
        SELECT id, display_name, lat, lon, cuisine_type, price_band,
               rating, user_rating_count, bnormal_2,
               ST_Distance(
                   geom::geography,
                   ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
               ) AS dist_m
        FROM places
        WHERE (h3_res10 = ANY($3) OR h3_res9 = ANY($3))
          AND ($4 = '' OR cuisine_type = $4)
          AND ($5 = '' OR price_band = $5)
          AND ST_DWithin(
              geom::geography,
              ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
              $6
          )
        ORDER BY bnormal_2 DESC
        LIMIT $7 OFFSET $8
    """, lat, lng, list(candidate_tiles), cuisine, price, WALK_RADIUS_M, PAGE_SIZE, offset)

    return {"page": page, "data": rows}
```

**Two-phase filter:** H3 k-ring tile membership (index) → `ST_DWithin` exact distance.  
Pagination: `page=1` returns rank 1–20, `page=2` returns 21–40, etc.

---

### `GET /api/place/{id}` — Single restaurant detail
Only fetches full metadata when user taps a pin. Never included in list responses.

```python
@app.get("/api/place/{place_id}")
async def get_place(place_id: str):
    row = await db.fetchrow(
        "SELECT * FROM places WHERE id=$1", place_id
    )
    if not row:
        raise HTTPException(status_code=404)
    return dict(row)
```

---

## Map Layers

### Layer 1 — Pin Count (H3 tile labels)
- Source: `/api/tiles` response `mode="tiles"`
- Renders: number label at `h3.cellToLatLng(tileId)` for each tile
- Hides: when `mode="places"` (≤20 results)

### Layer 2 — Heatmap (smooth kernel density, Option B)
- Source: same `/api/tiles` response
- At `mode="tiles"` (res 7/8/9): synthetic points = `[h3.cellToLatLng(tile), count]`
  - `h3.cellToLatLng()` runs **client-side** — no extra API call
- At `mode="places"` (≤20 results) **OR** zoom → res 10: **heatmap layer hides entirely**
- Weight: `count` from tiles, or `adjusted_quantile` when using actual place coords

---

## Cost Minimisation

| Technique | Impact |
|---|---|
| Pre-aggregated `h3_density` | Eliminates GROUP BY on every pan — highest impact |
| 60-second in-process TTL cache (`fastapi-cache2`) | Absorbs repeated pans over same area |
| Viewport snapped to H3 tile boundaries before cache key | Stops minor pan offsets causing cache misses |
| `asyncpg` pool `max_size=3` | Minimises Neon compute-seconds (wake cost) |
| `SELECT` only needed columns | Reduces data transfer |
| Place detail on tap only (`/api/place/{id}`) | Never fetches address/URI in list calls |
| Both Neon + Render scale to zero | No idle billing between sessions |

---

## Migration Checklist

```
[ ] 1. Create Neon project → copy DATABASE_URL to .env
[ ] 2. Run CREATE EXTENSION h3; CREATE EXTENSION postgis;
[ ] 3. Run CREATE TABLE places / h3_density DDL above
[ ] 4. ETL: run pipeline → server/out/places.csv (if not already fresh)
[ ] 5. ETL: derive h3_res10 from h3_res9 when needed
[ ] 6. ETL: pre-aggregate h3_density (Python script above)
[ ] 7. ETL: bulk insert places + h3_density into Neon
[ ] 8. Refactor server/server.py: new /api/tiles, /api/nearby, /api/place/{id}
[ ] 9. Install: asyncpg, fastapi-cache2[inmemory], h3
[  ] 10. Deploy FastAPI to Render.com, set DATABASE_URL env var
[ ] 11. Update React frontend to consume new endpoints
```
