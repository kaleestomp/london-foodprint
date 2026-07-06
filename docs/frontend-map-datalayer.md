# Frontend Map DataLayer Architecture

**Last updated:** 2026-07-06  
**Purpose:** Current handover note for the frontend map data layer, bubble mask behavior, and pin rendering flow.

---

## 1. What the DataLayer does

`DataLayer` is a React hook mounted inside the Leaflet `Map` wrapper. It orchestrates three responsibilities:

1. Reads the current map viewport and converts it into `/api/tiles` request params via `onUserRoam`
2. Renders backend tile results into persistent Leaflet marker layers
3. Keeps the search bubble mask behavior visually correct without forcing full density-pin rebuilds

The backend decides whether `/api/tiles` returns density tiles or place previews based on the query params, especially `res` and `places_only`.

---

## 2. Current architecture at a glance

### Map stack
- [Map.tsx](../src/MapPage/components/Map/Map.tsx) mounts the base map and the data layer hook
- [BaseLayer.ts](../src/MapPage/components/Map/BaseLayer/BaseLayer.ts) owns the Leaflet map instance and base layer
- [DataLayer.ts](../src/MapPage/components/Map/DataLayer/DataLayer.ts) owns tile fetching, filter reconciliation, and layer orchestration
- [BubbleAvatar](../src/MapPage/components/BubbleAvatar/BubbleAvatar.tsx) updates the active search mask when the bubble is dropped or removed

### Main data flow
1. `onUserRoam` converts viewport changes into `TilesParams`
2. `callRequestTiles` fetches `/api/tiles`
3. `DataLayer` decides whether the response is density mode or places mode
4. `usePinAnimations` coordinates animated marker lifecycles for both modes
5. Bubble-mask changes update marker visibility, not the viewport or the tile request key

---

## 3. Important files

```
src/MapPage/components/Map/
├── Map.tsx                           ← map composition entry point
├── BaseLayer/
│   ├── BaseLayer.ts                  ← creates the Leaflet map and attaches the basemap layer
│   ├── OSMLayer.ts                   ← optional OSM raster basemap implementation
│   └── useMapResizeSync.ts           ← invalidates map size on container resize
└── DataLayer/
    ├── DataLayer.ts                  ← main orchestrator hook
    ├── inputHooks/
    │   ├── onUserRoam.ts             ← viewport → TilesParams
    │   ├── callRequestTiles.ts       ← wraps useRequestTiles and loading-state handling
    │   └── delayLoadingScreen.ts     ← avoids flashing loading UI
    ├── LayerStates/
    │   ├── buildFilterKey.ts         ← stable filter key for reconciliation decisions
    │   ├── checkMaskChanged.ts       ← previous mask tracker (still available, but no longer part of density rebuild logic)
    │   └── filterTileOutsideMask.ts  ← mask-based filtering helpers
    ├── pinAnimations/
    │   ├── usePinAnimations.ts       ← thin orchestrator over density/place layer hooks
    │   ├── useDensityPinLayer.ts     ← density marker lifecycle + visibility toggling
    │   ├── usePlacePinLayer.ts       ← place marker lifecycle
    │   ├── computeExplodeOffsets.ts   ← zoom-in screen-space offsets
    │   ├── computeMergeOffsets.ts     ← zoom-out screen-space offsets
    │   └── densityPin.css            ← density animation classes
    ├── addDensityPins/
    │   ├── addDensityPins.ts          ← creates H3 density markers
    │   └── makePinIcon.ts             ← density pin SVG/icon factory
    ├── addPlacePins/
    │   ├── addPlaceMarkers.ts         ← creates restaurant place markers
    │   └── makePlacePinIcon.ts        ← place pin SVG/icon factory
    └── utils/
        └── addDebugTileOverlay.ts     ← debug-only H3 polygon overlay
```

---

## 4. Request pipeline

### Viewport-driven tile fetch
`onUserRoam` listens to `moveend` and `zoomend`, then updates viewport bounds and H3 resolution.

- The request only changes when the map viewport changes
- The bubble search mask does **not** enter the tile request params
- `places_only: true` is added when zoom reaches the place-preview threshold

### Request wrapper
`callRequestTiles` merges:
- viewport params from `onUserRoam`
- effective filter state from `SearchFiltersContext`
- the loading-state delay helper

`DataLayer` also stores the last tile viewport in `TileQueryContext` so the restaurant list can fall back to viewport bounds when the bubble mask is absent.

---

## 5. Bubble mask behavior

### How the mask is set
`BubbleAvatar` calls [useUpdateSearchMask](../src/MapPage/components/BubbleAvatar/Searchmask/useUpdateSearchMask.ts) whenever `droppedPos` changes.

- If the bubble is active, `searchMask = { center, radiusM }`
- If the bubble is removed, `searchMask = null`

### Current design goal
The mask should affect visibility, not trigger a fresh density pin rebuild.

### What happens now
- Density tiles stay in memory inside the persistent marker layer
- A mask change calls `setMaskVisibility(searchMask)`
- Each density marker simply gets `opacity: 0` or `opacity: 1` depending on whether it falls inside the bubble radius
- This preserves the "hide pins under the bubble" behavior while avoiding a full layer rebuild when the bubble is removed

### Places mode behavior
Places mode still filters out place previews that fall inside the mask via `filterPlacesOutsideMask`.

That means:
- bubble active -> places inside the bubble are hidden
- bubble removed -> the hidden places can become visible again

---

## 6. Persistent layer model

`createPersistentLayer` creates one `L.LayerGroup` and attaches it to the map once.

Why this matters:
- marker animation state is preserved across updates
- markers can be individually hidden, animated, or removed
- the app avoids tearing down the entire layer on every response

This is the main reason the app can now keep density tiles resident and only toggle their visibility when the bubble mask changes.

---

## 7. Pin rendering and animation

### Density pins
- Created by [addDensityPins.ts](../src/MapPage/components/Map/DataLayer/addDensityPins/addDensityPins.ts)
- Deduplicated by tile id via `renderedTilesRef`
- Animated by `useDensityPinLayer`
- `setMaskVisibility` changes opacity without rebuilding markers

### Place pins
- Created by [addPlaceMarkers.ts](../src/MapPage/components/Map/DataLayer/addPlacePins/addPlaceMarkers.ts)
- Managed by `usePlacePinLayer`
- First entry into places mode bursts density pins and flies place markers in
- Subsequent calls in places mode only append new place ids

### Resolution transitions
`useDensityPinLayer.transitionRes` still owns the animated density-resolution swap:
- zoom-in: old pins burst and new child pins fly in
- zoom-out: old pins fly toward parent centroids and removal is deferred for the exit animation

This is distinct from bubble-mask changes. Mask changes should now be visibility-only.

---

## 8. Control flow in `DataLayer`

```text
useEffect runs when response, filters, or mask change
│
├── If response.mode === 'places'
│   ├── filter places outside the bubble mask
│   └── transitionToPlaces(filteredPlaces)
│
└── If response.mode === 'tiles'
    ├── if returning from places mode → transitionFromPlaces(...)
    ├── if resolution changed → transitionRes(...)
    ├── otherwise addPins(...) for same-resolution incremental adds
    └── in all cases, call setMaskVisibility(searchMask)
```

Important detail:
- The app no longer uses bubble-mask changes as a reason to rebuild density markers
- The mask only affects opacity
- Filter changes can still cause a resolution-level reconcile when needed

---

## 9. Debug switches

These env flags are useful when profiling frame drops:

- `VITE_DEBUG_DISABLE_BASE_LAYER=true` disables the basemap layer
- `VITE_DEBUG_DISABLE_DATA_LAYER=true` disables the tile request / marker orchestration path
- `VITE_DEBUG_TILE_OVERLAY=true` replaces the normal density rendering path with the debug polygon overlay

Recommended profiling order:
1. Basemap off
2. Data layer off
3. Debug overlay on
4. Normal mode

That makes it easier to separate network latency, basemap decode/paint cost, and marker churn.

---

## 10. Current behavior summary

- [x] Viewport changes drive `/api/tiles` requests
- [x] Bubble mask is separate from tile request params
- [x] Bubble removal no longer forces a full density marker rebuild
- [x] Density markers are kept resident and hidden with opacity
- [x] Places mode still hides items inside the bubble mask
- [x] Persistent layer group prevents churn from remounting the whole layer
- [x] Debug toggles exist for isolating basemap vs data-layer cost

---

## 11. Notes and caveats

- `checkMaskChanged.ts` still exists, but the density path no longer relies on it for rebuild decisions
- Filter changes can still trigger a stronger reconcile path than mask changes
- The restaurant panel list has its own scope logic in [usePanelListQuery.ts](../src/MapPage/components/RestaurantInfoPanel/usePanelListQuery.ts) and can still fall back between bubble and viewport bounds independently of the map pins
- `OSMLayer.ts` remains in the codebase as an alternate basemap implementation, but the app currently uses the MapLibre GL base layer in [BaseLayer.ts](../src/MapPage/components/Map/BaseLayer/BaseLayer.ts)

---

## 12. Session note

The most important architectural shift since the earlier version of this document is that bubble-mask changes now affect marker visibility rather than marker identity. That is the key change that removed the forced re-render of density pins when the bubble is removed.
