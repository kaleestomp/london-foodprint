# Places-First Count Workflow (Backup)

This folder preserves the previous `/api/tiles` workflow where the API queried `places` first to compute `total` before deciding mode.

## Preserved File
- `tile_api_places_count_direct.py`

## Previous Decision Flow
1. Compute snapped viewport tiles and cache key.
2. Query `places` with viewport bbox + filters to get `COUNT(*)`.
3. If `total <= PAGE_SIZE` (20), query and return places.
4. Else query `h3_density` and return tile counts.

## Why Keep This Copy
- Easy rollback if tile-first strategy needs comparison.
- Benchmark reference for response time and DB load.
- Useful for validating behavior differences in edge cases.

## Tradeoff Notes
- Places-first gives direct place count semantics from the raw table.
- But it performs a potentially expensive `places` count on every pan/zoom cache miss.
- Under frequent map interactions, this can increase compute and DB time.

## Current Direction
The live endpoint is being moved to a tile-first decision path to reduce repeated `places` counting under map-heavy usage.
