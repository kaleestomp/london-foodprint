# TopPlacesLayer Architecture

Date: 2026-07-29

## Purpose
TopPlacesLayer owns the full top-place overlay pipeline on the map.

Responsibilities:
1. Build viewport query bounds for top places.
2. Fetch top-ranked places in the current viewport.
3. Fetch nearby places for search-mask bubble context.
4. Merge viewport and bubble top-place sources.
5. Render/update top-place markers with id-based reuse.
6. Publish active top-place ids for cross-layer dedupe.

## Main Files
1. `useTopPlacesLayer.ts`
2. `useTopPlacesViewport.ts`
3. `addTopPlacePins/addTopPlaceMarkers.ts`
4. `addTopPlacePins/TopPlacePin.ts`
5. `addTopPlacePins/getCuisineIconSrc.ts`
6. `addTopPlacePins/TopPlacePin.css`
7. `addTopPlacePins/topPlacesMarkerLifecycle.ts`
8. `addTopPlacePins/top-places-pin-rendering-behavior.md`

## Hook Inputs
`useTopPlacesLayer` consumes:
1. `mapRef`
2. `enabled`
3. `selectedPlaceId`
4. `setSelectedPlaceId`
5. `onActiveTopPlaceIdsChange`
6. `throttleMs`

It also reads filter state from SearchFiltersContext:
1. cuisines
2. cost
3. venue type
4. score basis
5. score tier
6. search mask

## Request Flow
### 1. Viewport top places
`useTopPlacesViewport` computes a screen-adjusted bbox:
1. Desktop applies fixed left offset for side panel footprint.
2. Mobile applies bottom offset based on panel peek footprint.
3. Move and zoom events are throttled.
4. `moveend` and `zoomend` flush immediately.

The result feeds `useRequestTopPlaces`.

### 2. Bubble top places
When a search mask exists:
1. `useRequestNearby` fetches nearby places.
2. `selectTopRankedPlaces` takes the top N.
3. Nearby rows are mapped into TopPlaceItem shape.

### 3. Unified limit
A single constant `FETCH_LIMIT = 15` is used for:
1. top-places API `limit`
2. nearby top-N selection

## Data Model Used by Layer
Top-place rows flowing through the layer use:
1. `id`
2. `restaurant_name`
3. `cuisine_type`
4. `lat` / `lon`
5. `normal_1`
6. `rank`

Nearby-derived items set missing fields to null:
1. `restaurant_name`
2. `cuisine_type`
3. `normal_1`

## Merge Strategy
The layer keeps two sticky sources:
1. `viewportTopPlaces`
2. `bubbleTopPlaces`

Rules:
1. Viewport items inside the search mask are filtered out.
2. Bubble items are always kept.
3. Both lists are merged by `id`.
4. Merged ids are published through `onActiveTopPlaceIdsChange`.

## Marker Lifecycle
`syncTopPlaceMarkers` owns marker reuse and lifecycle:
1. Marker identity keyed by `place.id`.
2. Existing markers are reused from cache.
3. Click handler attaches only on first creation.
4. Position updates only when lat/lon changed.
5. Exit removal is delayed (`360ms`) to allow exit animation.
6. Cache TTL pruning removes stale inactive entries (`30s`).

## Selected Marker Persistence
Selection affects lifecycle, not just CSS:
1. Selected marker is kept active even if missing from latest merged payload.
2. Pending removal timer for selected marker is canceled.
3. Selected marker exits only after unselection.

Unselection triggers:
1. Map background click.
2. Selecting another top-place marker (selected id changes).

## Pin Rendering Stack
Marker visuals are split into dedicated layers:
1. `TopPlacePin.ts` builds Leaflet divIcon HTML and animation shell classes.
2. `getCuisineIconSrc.ts` resolves cuisine icon asset URL via `import.meta.glob`.
3. `TopPlacePin.css` controls enter/exit, hover, selected lift/scale, bubble background, and anchor dot.

## Cuisine Icon Resolution
Icon source resolution behavior:
1. `cuisine_type` is normalized via CUISINE_DISPLAY mapping.
2. Lowercased display value maps to `src/assets/icon_cuisines/*.png`.
3. Missing/unknown values fallback to `unspecified` icon.

## Selection Visual Behavior
When selected, the pin:
1. Adds `.is-selected` to shell and motion layers.
2. Lifts upward and scales.
3. Switches to selected floating animation.
4. Shows a speech-bubble style background and anchor dot.

## Published Output
TopPlacesLayer publishes only active top-place ids:
1. `onActiveTopPlaceIdsChange(ids)`

Primary consumer:
1. DensityPlacesLayer dedupe/suppression of overlapping normal markers.

## Architectural Notes
TopPlacesLayer still intentionally couples request + render concerns because:
1. Viewport shape drives request cadence and bounding.
2. Bubble merge directly changes rendered ids.
3. Selection persistence needs request/lifecycle coordination.

Future split remains possible if complexity grows:
1. `useTopPlacesRequestState`
2. `useTopPlacesMarkerState`
3. `useTopPlacesLayer` composition wrapper
