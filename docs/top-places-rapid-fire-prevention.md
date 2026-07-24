# Top Places Overlay: Rapid-Fire Prevention and Caching

Date: 2026-07-10

## Goal
Prevent rapid viewport pan/zoom interactions from overloading APIs while keeping map feedback responsive.

## Chosen Strategy
Use layered protection (frontend + backend) and avoid high-cardinality response caching for bbox-scoped queries.

## Frontend Controls
1. Trigger requests from `moveend` / `zoomend` viewport updates only.
2. Use trailing debounce (150ms) before sending the top-places request.
3. Abort stale requests with `AbortController`.
4. Guard state updates with request id checks so late responses are ignored.
5. Use in-memory fetch cache with in-flight dedupe (`createCachedMemoryFetcher`).

## Backend Controls
1. Add `/api/places/top` endpoint for viewport top-N places.
2. Reuse existing normalization (`normalize_dimension_list`, `normalize_dimension`, `get_score_basis_column`).
3. Do not persist bbox response caches (`/api/places/top` and bbox places mode in `/api/tiles`) due to high key cardinality and low expected reuse.
4. Keep request coalescing (single-flight) for `/api/tiles` density reads so concurrent identical requests share one in-flight DB query.
5. Keep cache only where cardinality is low and hit rate is high (citywide histograms).
6. Use centralized cache key builders in `server/api/cache_keys.py` for citywide and snapped-tile scopes.

## Cache Policy
1. `/api/places/top`: no backend response cache (direct query per request).
2. `/api/tiles`:
	- no persistent response cache for tiles or places fallback payloads
	- single-flight dedupe by snapped-tile key for concurrent identical tile-density requests
3. Histograms:
	- citywide scope cached with TTL
	- view scope not cached

## Why This Is Resource-Efficient
1. Avoids unbounded in-process memory growth from bbox key churn.
2. Keeps database load controlled with pre-aggregated `h3_density` and single-flight coalescing.
3. Debounce + abort reduces duplicate in-flight work.
4. Keeps backend behavior predictable under tight memory limits.

## Follow-Ups (Optional)
1. Add response headers (`Cache-Control`) if CDN/browser caching is desired.
