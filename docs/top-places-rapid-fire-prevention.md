# Top Places Overlay: Rapid-Fire Prevention and Caching

Date: 2026-07-10

## Goal
Prevent rapid viewport pan/zoom interactions from overloading APIs while keeping map feedback responsive.

## Chosen Strategy
Use layered protection (frontend + backend) and align cache key design with the existing tiles endpoint.

## Frontend Controls
1. Trigger requests from `moveend` / `zoomend` viewport updates only.
2. Use trailing debounce (150ms) before sending the top-places request.
3. Abort stale requests with `AbortController`.
4. Guard state updates with request id checks so late responses are ignored.
5. Use in-memory fetch cache with in-flight dedupe (`createCachedMemoryFetcher`).

## Backend Controls
1. Add `/api/places/top` endpoint for viewport top-N places.
2. Reuse existing normalization (`normalize_dimension_list`, `normalize_dimension`, `get_score_basis_column`).
3. Build cache key from exact viewport bbox + active filters so key scope matches bbox SQL scope.
4. Keep short TTL using existing tile cache TTL (`TILES_CACHE_TTL_SECONDS`, default 60s).
5. Coalesce concurrent cache misses with single-flight dedupe so only one request computes each key at a time.
6. Use centralized cache key builders in `server/api/cache_keys.py` for citywide, bbox, and snapped-tile strategies.

## Cache-Key Policy
Key shape:
- `v1|top_places|bbox_exact|<sw_lat>|<sw_lng>|<ne_lat>|<ne_lng>|<res>|<filters...>|<limit>`

BBox tokens are normalized to fixed precision to avoid float-noise key fragmentation.

Tile-snapped cache keys are still used for tile-density workloads where SQL scope is tile-based.

## Why This Is Resource-Efficient
1. Better cache hit rate means fewer database queries.
2. In-memory cache avoids extra external cache infrastructure.
3. Debounce + abort reduces duplicate in-flight work.
4. Short TTL keeps data fresh enough for map exploration.

## Follow-Ups (Optional)
1. Add response headers (`Cache-Control`) if CDN/browser caching is desired.
