# DataLayer Architecture

Date: 2026-07-10

## Purpose
`DataLayer` is the top-level frontend map overlay orchestrator.

It does not render markers directly. Instead, it composes two independent overlay systems:

1. `TopPlacesLayer`
2. `DensityPlacesLayer`

## High-Level Responsibilities

### `DataLayer`
Owns only cross-layer coordination state:

1. Current selected place id
2. Current active top-place ids
3. Mounting both overlay hooks against the shared Leaflet map instance

### `TopPlacesLayer`
Owns:

1. Viewport-aware top-place requests
2. Nearby bubble top-place requests
3. Merging top-place sources
4. Top-place marker lifecycle and selection UI
5. Publishing active top-place ids back to `DataLayer`

### `DensityPlacesLayer`
Owns:

1. Tile / places request lifecycle
2. Filter consumption for tile requests
3. Density-pin and place-pin transition orchestration
4. Deduping normal place markers against active top-place ids

## Current Composition

`DataLayer.ts` is intentionally thin.

It currently performs these steps:

1. Read `selectedPlaceId` / `setSelectedPlaceId` from `PlaceSelectionContext`
2. Hold `activeTopPlaceIds` local state
3. Mount `useTopPlacesLayer(...)`
4. Mount `useDensityPlacesLayer(...)`

## Cross-Layer Contract

The main cross-layer contract is the top-place dedupe flow.

1. `TopPlacesLayer` computes the currently active top-place ids
2. It sends them upward via `onActiveTopPlaceIdsChange`
3. `DataLayer` stores them in local state
4. `DensityPlacesLayer` receives `activeTopPlaceIds`
5. `DensityPlacesLayer` removes or suppresses overlapping normal place markers

This keeps the two overlay systems independent while still preventing duplicate visual markers.

## Why The Split Exists

### Top places overlay is different from density / places

Top places uses:

1. Debounced drag-aware viewport requests
2. Separate top-place marker cache
3. Exit animation and TTL behavior
4. Merge of viewport top places and nearby bubble top places

Density / places uses:

1. Immediate tile request flow from `moveend` / `zoomend`
2. Density-to-places and places-to-density transitions
3. Persistent place markers during pan
4. Selective dedupe against top-place ids

These behaviors are different enough that keeping them as separate layer hooks is intentional.

## Related Docs

1. `TopPlacesLayer/top-places-layer-architecture.md`
2. `DensityPlacesLayer/density-places-layer-architecture.md`
3. `TopPlacesLayer/addTopPlacePins/top-places-pin-rendering-behavior.md`
