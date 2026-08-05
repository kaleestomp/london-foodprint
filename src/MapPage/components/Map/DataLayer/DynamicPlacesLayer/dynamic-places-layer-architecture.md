# DynamicPlacesLayer Architecture

Date: 2026-07-10
Updated: 2026-08-05

## Purpose
`DynamicPlacesLayer` owns the dynamic tile/places rendering state machine for map markers.

It is responsible for:

1. Fetching tile API results for the current viewport/filter state
2. Switching between `tiles` mode and `places` mode
3. Coordinating animated transitions between density pins and place pins
4. Preserving marker continuity on pan where possible
5. Deduping markers that collide with active top-place ids
6. Applying search-mask visibility to density markers

## Main Files

1. `useDynamicPlacesLayer.ts`
2. `InputHooks/useFetchTiles.ts`
3. `useZoomThreshold/useZoomThreshold.ts`
4. `useDensityLayer/useDensityLayer.ts`
5. `usePlacesLayer/usePlacesLayer.ts`
6. `lifecycle/lifecycle.ts`

## High-Level Composition

`useDynamicPlacesLayer` composes three concerns:

1. Request + filter/query state (`useFetchTiles`, `useSearchFilters`)
2. Density marker subsystem (`useDensityLayer`)
3. Place marker subsystem (`usePlacesLayer`)

`usePlacesLayer` depends on a typed `DensityLayer` handle so it can coordinate cross-layer transitions without creating circular logic.

## Request Ownership

`useDynamicPlacesLayer` owns request consumption via `useFetchTiles(enabled)`.

`useFetchTiles`:

1. Reads viewport params from `TileQueryContext`
2. Reads active filters from `SearchFiltersContext`
3. Assembles request params for `useRequestTiles`
4. Publishes settled params back through `setLastTilesParams`

Guard rails in `useDynamicPlacesLayer` ensure no render side effects happen when:

1. Layer is disabled
2. Map/layer refs are not ready
3. Request is not successful
4. Data is placeholder from previous query key
5. Zoom is below threshold (`< 12`)

## Runtime Modes

The layer supports two API modes from `res.mode`.

### Mode: `places`

Flow:

1. Persist mode in `prevModeRef`
2. Apply mask filter to incoming places via `maskPlaces`
3. Remove ids that exist in `activeTopPlaceIds`
4. Call `placesLayer.syncLayer(newPlaces, filterKeyChanged)`
5. If top-place ids changed, selectively remove those place markers by id

Result:

1. First places entry performs density -> places animation
2. Subsequent places updates preserve existing markers and only add new ids
3. Full replace is only used on filter-key changes

### Mode: `tiles`

Flow:

1. If returning from places mode, call `placesLayer.removeLayer(resolution, densityTiles)`
2. Otherwise, update density directly:
3. Resolution/filter-key changed -> `densityLayer.refreshLayer(...)`
4. Same resolution pan -> `densityLayer.addMarkersToLayer(...)`
5. Apply `densityLayer.setMaskVisibility(searchMask)`

Result:

1. Places -> tiles transition has no visual gap (new density pins appear while places exit)
2. Same-resolution pans append only missing tiles
3. Mask visibility remains in sync after each tiles update

## Density Subsystem (`useDensityLayer`)

`useDensityLayer` owns density marker refs and transition bookkeeping:

1. `checkedTilesRef`: tiles already processed for dedupe
2. `densityMarkerRef`: tile -> marker map
3. `singletonMarkerRef`: tile ids rendered as singleton place-style markers
4. `currentResRef`: active H3 resolution

Public API:

1. `refreshLayer(res, tiles)` for resolution/filter transitions
2. `addMarkersToLayer(res, tiles)` for same-resolution pan append
3. `setMaskVisibility(searchMask)` for bubble masking
4. `cancelScheduledLayerRemoval()` and `resetLayerState()` for lifecycle control

Animation behavior:

1. Zoom-in: outgoing markers burst, incoming markers can fly in from parent offsets
2. Zoom-out: outgoing markers merge/fade, incoming parent markers are added immediately
3. Deferred cleanup removes outgoing markers after animation delay

## Place Subsystem (`usePlacesLayer`)

`usePlacesLayer` owns place marker refs and cross-mode transitions.

Public API:

1. `syncLayer(places, replaceAll?)`
2. `removeLayer(curRes, densityTiles)`
3. `removeMarkerFromLayer(placeIds)`
4. `cancelScheduledLayerRemoval()` and `resetLayerState()`

Behavior details:

1. On first entry to places mode, it cancels pending timers, snapshots density markers, bursts them, computes place fly-in offsets, then creates place markers.
2. On places-mode pan, it adds only new place ids and keeps existing markers intact.
3. On places -> tiles, it animates place markers back toward host-tile centroids while creating incoming density pins in the same frame, then schedules outgoing cleanup.

## Singleton Tile Handling

A `TileDensity` item with `count === 1` and `singleton` metadata is rendered as a place-style dot at real place coordinates.

Rules:

1. If singleton id exists in `activeTopPlaceIds`, marker creation is skipped.
2. Singleton markers are tracked in `singletonMarkerRef`.
3. Singleton markers do not use centroid-relative fly-in offsets.
4. On zoom-out, singleton outgoing markers fade instead of centroid-merge when required by transition logic.

## Top-Place Dedupe Strategy

Dedup happens in two stages:

1. Pre-render filtering in `useDynamicPlacesLayer` removes incoming places already present in `activeTopPlaceIds`.
2. Reactive cleanup in places mode removes already-rendered place markers when top-place ids change.

This preserves marker continuity while preventing duplicate visual representation of the same place.

## Zoom Threshold Suppression

`useZoomThreshold` suppresses marker visibility below zoom `12` by:

1. Applying exit animation classes
2. Removing markers after animation duration
3. Triggering `onThresholdCross` when returning above threshold

`useDynamicPlacesLayer` handles threshold recovery by resetting `densityLayer.currentResRef.current = null`, forcing a clean density render on re-entry.

## Lifecycle Boundaries

The dynamic density/places lifecycle is isolated under `DynamicPlacesLayer/lifecycle` and is intentionally separate from `TopPlacesLayer` lifecycle logic.

Dynamic lifecycle concerns:

1. Cross-mode transition sequencing
2. Deferred marker cleanup timers
3. Shared layer integrity across density/place subsystems
