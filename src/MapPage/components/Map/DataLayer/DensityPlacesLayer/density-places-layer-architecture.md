# DensityPlacesLayer Architecture

Date: 2026-07-10  
Updated: 2026-07-12

## Purpose
`DensityPlacesLayer` owns the main tile / places rendering pipeline for the map.

It is responsible for:

1. Requesting tile or places data for the current map viewport
2. Reading current filter state for those requests
3. Orchestrating density-pin and place-pin transitions
4. Preserving place-marker continuity during pan
5. Removing duplicate normal place markers when a top-place marker exists

## Main Files

1. `useDensityPlacesLayer.ts`
2. `animation/usePinAnimations.ts`
3. `addDensityPins/useDensityPinLayer.ts`
4. `addPlacePins/usePlacePinLayer.ts`
5. `lifecycle/densityPlacesMarkerLifecycle.ts`

## Request Ownership

Unlike the earlier architecture, `useDensityPlacesLayer` now owns its request pipeline directly.

It reads:

1. Filter state from `SearchFiltersContext`
2. Tile query sink from `TileQueryContext`

It calls:

1. `callRequestTiles(mapRef, enabled)`

It also pushes `requestParams` back into `TileQueryContext` through `setLastTilesParams`.

## Rendering Modes

The layer supports two tile API modes.

### 1. `mode === 'tiles'`

The layer renders density pins.

Behavior:

1. Resolution changes use animated density transitions
2. Same-resolution pans only add missing density pins
3. Existing density pins persist where possible

### 2. `mode === 'places'`

The layer renders individual place markers.

Behavior:

1. Density pins burst away on first entry
2. Place pins fly in from their host tile
3. Subsequent pans in places mode keep existing place markers and only add new ids

## Density / Places Orchestrator

`usePinAnimations` is a thin composition layer over:

1. `useDensityPinLayer`
2. `usePlacePinLayer`

It exposes:

1. Density transitions
2. Place transitions
3. Shared clear/reset behavior
4. Selective place-marker removal by id

## Top-Place Dedupe

This layer receives `activeTopPlaceIds` from `DataLayer`.

When in places mode:

1. Incoming place results are filtered against the active top-place id set
2. Existing conflicting place markers are selectively removed by id
3. Non-conflicting place markers are preserved
4. Full `replaceAll` is used only for actual filter changes, not for top-place id churn

This preserves marker persistence while preventing visual duplicates.

## Why Selective Remove Was Chosen

An earlier version forced `replaceAll` when top-place ids changed.

That solved duplicates, but caused unnecessary teardown of persistent place markers.

Selective remove is cleaner because it:

1. Removes only conflicting ids
2. Preserves non-conflicting place markers
3. Keeps places-mode continuity intact

## Lifecycle Split

Density / places uses a different lifecycle family from top places.

### Density / places lifecycle

Focuses on:

1. Deferred cleanup timers
2. Transition sequencing
3. Mode switching between density and place rendering

### Top places lifecycle

Focuses on:

1. Diff-by-id updates
2. Exit animation
3. TTL cache reuse

Keeping these separate is intentional because the interaction models are different.

---

## Singleton Tile Handling

### What is a singleton tile?

The tile API returns `TileDensity` records per H3 tile. When `count === 1` and the record includes a `singleton` field (`{ id, lat, lon }`), the tile contains exactly one place.

### Rendering

Singleton tiles are rendered as **place-style dot markers** at the actual place `lat/lon`, not at the H3 tile centroid. This is handled inside `addDensityPins` as a separate branch from multi-count density markers.

```
count === 1 && singleton present  →  makePlacePinIcon at place lat/lon
count > 1                         →  makePinIcon at H3 centroid
```

The `maxCount` used to size density markers excludes singletons so a single-place tile cannot deflate the size scale of the rest of the viewport.

### Top-place dedupe

`addDensityPins` receives an optional `topPlaceIds: Set<string>`. If the singleton's place ID is in this set, the tile is skipped entirely — no marker is created. This prevents a dot marker appearing beneath a diamond top-place marker at the same location.

Dedup for the full **places mode** response is handled one layer up in `useDensityPlacesLayer`, before `transitionToPlaces` is called (the filter there covers both singleton-origin and places-mode places).

### Animation: zoom-in (tiles → tiles)

Singleton markers do **not** receive the explode fly-in offset (`startOffset` is ignored). The explode offset is tile-centroid-relative, but singleton markers sit at the actual place location — applying a centroid offset would animate them in from the wrong screen position. They appear with a simple fade-in (`density-pin-enter`) instead.

### Animation: zoom-out (tiles → tiles)

Singleton markers do **not** receive the merge fly-out animation. Regular density markers animate toward their parent tile centroid (`density-pin-fly-out`). For singletons this would move the marker away from the place toward a nearby centroid, which is visually incorrect. They fade out (`density-pin-exit`) instead.

This is implemented via `singletonTileIdsRef` — a `Set<string>` of tile IDs currently rendered as singleton place markers, maintained by `useDensityPinLayer`.

### `singletonTileIdsRef` lifecycle

| Event | Action |
|---|---|
| `addDensityPins` returns `isSingleton: true` | Caller adds tile ID to `singletonTileIdsRef` |
| `transitionRes` starts | Snapshot outgoing singleton IDs; clear ref before populating new markers |
| `resetState()` | Ref cleared alongside `markersByTileRef` and `renderedTilesRef` |
| `transitionFromPlaces` (in `usePlacePinLayer`) | Re-populates `density.singletonTileIdsRef` from the newly created density markers |

The last point is critical: `transitionFromPlaces` calls `addDensityPins` to render the new density layer. It must also sync `singletonTileIdsRef` from the result so that any subsequent zoom-out correctly identifies singletons in the outgoing set.

### `DensityPinLayerHandle` interface

`usePlacePinLayer` accesses density state through a typed contract exported from `useDensityPinLayer`. This keeps the dependency direction explicit: `usePlacePinLayer` imports the interface from its provider rather than defining its own private copy.

Fields included in the handle:

| Field | Purpose |
|---|---|
| `currentResRef` | Current H3 resolution being rendered |
| `renderedTilesRef` | Set of already-rendered tile IDs (prevents duplicate markers on pan) |
| `markersByTileRef` | Live tile → marker map; used to compute fly-in offsets on density→places transition |
| `singletonTileIdsRef` | Tiles currently rendered as singleton place markers |
| `cancelTimer` | Cancels any pending deferred marker removal |
| `resetState` | Wipes all density refs; called at the start of a density→places transition |

### Animation class reference for singleton markers

| Class | Applied when | Effect |
|---|---|---|
| `density-pin-enter` | Singleton created (zoom-in or pan) | Simple fade-in |
| `density-pin-exit` | Singleton in outgoing set on zoom-out | Simple fade-out |
| `density-pin-burst` | *(never applied to singletons)* | Would burst from centroid; skipped because marker is at place lat/lon |
| `density-pin-fly-out` | *(never applied to singletons)* | Would merge toward centroid; skipped for same reason |
