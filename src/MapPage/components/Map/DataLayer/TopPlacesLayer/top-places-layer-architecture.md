# TopPlacesLayer Architecture

Date: 2026-07-29

## Purpose
TopPlacesLayer owns the full top-place overlay pipeline on the map, from viewport-driven requests through marker sync and selection-aware lifecycle handling.

Responsibilities:
1. Build viewport query bounds for top places.
2. Fetch top-ranked places from viewport and nearby bubble sources.
3. Merge those sources into a single active list.
4. Render and update marker layers with id-based reuse.
5. Keep the currently selected marker visible and animated until it is deselected.
6. Publish active top-place ids for cross-layer dedupe.

## Main Files
1. [src/MapPage/components/Map/DataLayer/TopPlacesLayer/useTopPlacesLayer.ts](src/MapPage/components/Map/DataLayer/TopPlacesLayer/useTopPlacesLayer.ts)
2. [src/MapPage/components/Map/DataLayer/TopPlacesLayer/InputHooks/useFetchTopPlaces.ts](src/MapPage/components/Map/DataLayer/TopPlacesLayer/InputHooks/useFetchTopPlaces.ts)
3. [src/MapPage/components/Map/DataLayer/TopPlacesLayer/InputHooks/useViewportFetch/useViewportFetch.ts](src/MapPage/components/Map/DataLayer/TopPlacesLayer/InputHooks/useViewportFetch/useViewportFetch.ts)
4. [src/MapPage/components/Map/DataLayer/TopPlacesLayer/InputHooks/useNearbyFetch/useNearbyFetch.ts](src/MapPage/components/Map/DataLayer/TopPlacesLayer/InputHooks/useNearbyFetch/useNearbyFetch.ts)
5. [src/MapPage/components/Map/DataLayer/TopPlacesLayer/InputHooks/useMergePlaces/useMergePlaces.ts](src/MapPage/components/Map/DataLayer/TopPlacesLayer/InputHooks/useMergePlaces/useMergePlaces.ts)
6. [src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/syncMarkers.ts](src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/syncMarkers.ts)
7. [src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/addMarkers.ts](src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/addMarkers.ts)
8. [src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/handleSelectedMarker.ts](src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/handleSelectedMarker.ts)
9. [src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/removeMarkers.ts](src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/removeMarkers.ts)
10. [src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/markerLifecycle/markerLifecycle.ts](src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/markerLifecycle/markerLifecycle.ts)
11. [src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/markerLifecycle/scheduleRemoval.ts](src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/markerLifecycle/scheduleRemoval.ts)
12. [src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/markers/TopPlacePin.ts](src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/markers/TopPlacePin.ts)
13. [src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/markers/getCuisineIconSrc.ts](src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/markers/getCuisineIconSrc.ts)
14. [src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/markers/TopPlacePin.css](src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/markers/TopPlacePin.css)

## Hook Inputs
The hook in [src/MapPage/components/Map/DataLayer/TopPlacesLayer/useTopPlacesLayer.ts](src/MapPage/components/Map/DataLayer/TopPlacesLayer/useTopPlacesLayer.ts) consumes:
1. `mapRef`
2. `enabled`
3. `selectedPlaceId`
4. `setSelectedPlaceId`
5. `setActiveTopPlaceIds`

It also reads filter state from SearchFiltersContext:
1. cuisines
2. cost
3. venue type
4. score basis
5. score tier
6. search mask

## Request Flow
### 1. Viewport top places
The viewport fetch hook builds a screen-adjusted bbox and requests matching top places.

### 2. Nearby bubble top places
When a search mask exists, the nearby fetch hook requests context rows around the mask and passes them into the merge step.

### 3. Unified request limit
The fetch layer uses a shared limit constant so viewport and nearby requests stay aligned.

## Data Model Used by Layer
Top-place rows flowing through the layer use:
1. `id`
2. `restaurant_name`
3. `cuisine_type`
4. `lat` / `lon`
5. `normal_1`
6. `rank`

Nearby-derived items may have missing display fields, which are treated as null or fallback values.

## Merge Strategy
The layer keeps two input sources:
1. viewport places
2. nearby/bubble places

Rules:
1. Viewport items inside the search mask are filtered out.
2. Bubble items are always retained when they are part of the merged active set.
3. Both lists are merged by `id`.
4. The resulting active ids are published through the reporting hook.

## Marker Sync Pipeline
The marker layer is now split into dedicated steps:
1. [src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/syncMarkers.ts](src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/syncMarkers.ts) orchestrates the full sync pass.
2. [src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/addMarkers.ts](src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/addMarkers.ts) creates or reuses markers, attaches handlers, and updates the layer membership.
3. [src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/handleSelectedMarker.ts](src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/handleSelectedMarker.ts) ensures the selected marker remains visible even if it is temporarily absent from the latest payload.
4. [src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/removeMarkers.ts](src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/removeMarkers.ts) schedules exit animations and prunes stale cache entries.

## Marker Lifecycle
The lifecycle helpers live in [src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/markerLifecycle/markerLifecycle.ts](src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/markerLifecycle/markerLifecycle.ts) and [src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/markerLifecycle/scheduleRemoval.ts](src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/markerLifecycle/scheduleRemoval.ts):
1. Marker identity is keyed by `place.id`.
2. Existing markers are reused from the cache.
3. Click handling is attached only on first creation.
4. Exit removal is delayed to allow the exit animation to complete.
5. Cache TTL pruning removes stale inactive entries after a timeout.

## Selected Marker Persistence
Selection now affects lifecycle and visibility, not just CSS:
1. The selected marker is kept active even if it is missing from the latest merged payload.
2. Any pending removal timer for that marker is canceled.
3. The marker is re-added to the layer and re-enter animation is restarted if needed.
4. It exits only after the selection is cleared.

Unselection triggers:
1. A map background click.
2. Selecting another top-place marker.

## Pin Rendering Stack
Marker visuals are split into dedicated layers:
1. [src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/markers/TopPlacePin.ts](src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/markers/TopPlacePin.ts) builds the Leaflet divIcon HTML and animation shell classes.
2. [src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/markers/getCuisineIconSrc.ts](src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/markers/getCuisineIconSrc.ts) resolves the cuisine icon asset URL.
3. [src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/markers/TopPlacePin.css](src/MapPage/components/Map/DataLayer/TopPlacesLayer/syncMarkers/markers/TopPlacePin.css) controls enter/exit motion, hover state, selected lift/scale, bubble background, and anchor dot.

## Cuisine Icon Resolution
Icon source resolution behavior:
1. `cuisine_type` is normalized to a display label.
2. The display label is mapped to an asset under the cuisine icon folder.
3. Unknown or missing values fall back to the unspecified icon.

## Selection Visual Behavior
When selected, the pin:
1. Adds the `.is-selected` class to the shell and motion layers.
2. Lifts upward and scales.
3. Switches to the selected floating animation.
4. Shows the bubble-style background and anchor dot.

## Published Output
TopPlacesLayer publishes only the currently active top-place ids through the reporting hook.

Primary consumer:
1. DensityPlacesLayer uses the ids to suppress overlapping normal markers.

## Architectural Notes
The refactor splits request concerns from marker concerns more clearly:
1. The request layer is composed by the fetch hooks.
2. The sync layer handles marker addition, selection persistence, and removal.
3. The lifecycle helpers manage cache entries and delayed removal timers.

This separation makes the pipeline easier to reason about while keeping the overall behavior unchanged.
