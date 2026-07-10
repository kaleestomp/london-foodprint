# TopPlacesLayer Architecture

Date: 2026-07-10

## Purpose
`TopPlacesLayer` owns the complete top-place overlay pipeline.

It is responsible for:

1. Defining the fetch viewport for top places
2. Fetching top-ranked places in view
3. Fetching nearby places for the search bubble
4. Merging both sources into one top-place overlay
5. Rendering and updating top-place markers
6. Reporting active top-place ids for cross-layer dedupe

## Main Files

1. `useTopPlacesLayer.ts`
2. `useTopPlacesViewport.ts`
3. `addTopPlacePins/addTopPlaceMarkers.ts`
4. `addTopPlacePins/makeTopPlacePinIcon.ts`
5. `addTopPlacePins/topPlacesMarkerLifecycle.ts`
6. `addTopPlacePins/top-places-pin-rendering-behavior.md`

## Request Inputs

`useTopPlacesLayer` consumes:

1. Map ref
2. Enabled flag
3. Selected place id
4. `setSelectedPlaceId`
5. `onActiveTopPlaceIdsChange`
6. Debounce interval

It also reads filter state from `SearchFiltersContext`.

## Request Sources

### 1. Viewport top places

`useTopPlacesViewport` computes a screen-adjusted bbox.

Current behavior:

1. Mobile applies a fixed bottom offset based on the closed pull-up panel footprint
2. Desktop applies a fixed left offset for the side panel footprint
3. `move` updates are debounced
4. `zoomend` updates are immediate

The resulting bbox is used by `useRequestTopPlaces`.

### 2. Bubble top places

If a search mask exists, `useRequestNearby` fetches nearby results for the bubble.

Those results are locally ranked with `selectTopRankedPlaces` and converted into top-place items.

## Merge Strategy

The layer keeps two sticky source lists:

1. `viewportTopPlaces`
2. `bubbleTopPlaces`

Rules:

1. Viewport top places are masked to exclude places inside the search bubble
2. Bubble top places are always allowed inside the bubble
3. Both lists are merged by `id`
4. Bubble ids are also passed to marker sync so bubble styling can be applied

## Marker Lifecycle

`syncTopPlaceMarkers` owns top-place marker reuse.

It provides:

1. Marker reuse by `place.id`
2. Highlight assignment for top-ranked items
3. Exit animation for disappearing pins
4. TTL cache for recently seen markers
5. Bubble-specific shell class toggling

This layer is intentionally separate from density / place pin lifecycle logic.

## Selection Behavior

Selection is visual-only inside this layer.

When a top-place marker is selected:

1. The selected shell class is applied
2. The selected motion class is applied
3. The popup is opened
4. Hover scaling is neutralized so selected hover does not double-scale

## Published Output

The layer publishes active top-place ids upward through:

1. `onActiveTopPlaceIdsChange`

This is used by `DensityPlacesLayer` to suppress duplicate normal place markers.

## Architectural Notes

This layer intentionally owns both request and rendering logic because its behavior is tightly coupled:

1. Viewport shape affects request frequency
2. Bubble merge affects rendered ids
3. Active top-place ids must be known at render time for dedupe

If this area needs further decomposition later, the clean split would be:

1. `useTopPlacesRequestState`
2. `useTopPlacesLayer`

But that split is not required for the current code size.
