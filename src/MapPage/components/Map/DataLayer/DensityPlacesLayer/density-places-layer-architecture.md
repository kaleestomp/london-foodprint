# DensityPlacesLayer Architecture

Date: 2026-07-10

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
