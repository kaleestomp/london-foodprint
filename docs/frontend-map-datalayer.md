# Frontend Map — DataLayer Architecture & Session Notes

**Last updated:** 2026-06-12  
**Purpose:** Handover document for resuming DataLayer development in a new session.

---

## 1. What the DataLayer does

`DataLayer` is a React hook (not a component) mounted inside the Leaflet `MapCard`. It:

1. Watches the map viewport (zoom + pan) via `onUserRoam`
2. Fires API requests to `/api/tiles` via `useRequestTiles`
3. Renders either **density pins** (H3 tile counts, res 7–9) or **place marker pins** (individual restaurants, res 10) onto a persistent `L.LayerGroup`
4. Animates transitions between resolution levels and between modes

The API backend decides which mode to return based on the `res` and `places_only` params.

---

## 2. File structure

```
src/Page1/components/MapCard/Map/DataLayer/
│
├── DataLayer.ts                        ← main hook / orchestrator
│
├── addDensityPins/
│   ├── addDensityPins.ts               ← creates L.Marker instances at H3 centroids
│   └── makePinIcon.ts                  ← SVG teardrop icon factory (green #1a936f)
│
├── addPlacePins/
│   ├── addPlaceMarkers.ts              ← creates L.Marker instances for place pins
│   └── makePlacePinIcon.ts             ← SVG pin factory (dark teal #114b5f, white dot)
│
├── pinAnimations/
│   ├── usePinAnimations.ts             ← thin orchestrator hook (~35 lines)
│   ├── useDensityPinLayer.ts           ← density pin lifecycle
│   ├── usePlacePinLayer.ts             ← place pin lifecycle
│   ├── computeExplodeOffsets.ts        ← zoom-in fly-in offsets (child from parent)
│   ├── computeMergeOffsets.ts          ← zoom-out fly-out offsets (child toward parent)
│   └── densityPin.css                  ← all animation CSS keyframes + classes
│
└── utils/
    ├── onUserRoam.ts                   ← debounced viewport → TilesParams
    ├── zoomToResolution.ts             ← PINS_ZOOM_TO_RES table
    ├── createPersistentLayer.ts        ← persistent L.LayerGroup (never removed from map)
    └── delayLoadingScreen.ts           ← delays loading indicator to avoid flash
```

---

## 3. Key design decisions

### H3 resolution table (frontend-owned)
```ts
// zoomToResolution.ts
PINS_ZOOM_TO_RES = [[12,7], [14,8], [16,9], [18,10]]
// Leaflet zoom → H3 resolution
```

### places_only override
`onUserRoam` sets `places_only: true` when `res >= 10`. The backend then skips the density query and returns up to 100 individual places instead.

### Persistent layer
`createPersistentLayer` attaches a single `L.LayerGroup` to the map once and never removes it. Markers are individually added/removed. This prevents flicker between pan updates.

### Pin rendering
Both density and place pins use `L.divIcon` with an inline SVG teardrop. They are zoom-invariant (screen-pixel size, not geo-scaled). CSS animation classes are toggled on the `.density-pin` wrapper `<div>`.

---

## 4. Animation system

### CSS classes (densityPin.css)

| Class | Animation | Duration | When |
|---|---|---|---|
| `density-pin-enter` | pin-pop (scale bounce) | 0.3s | New pin appears |
| `density-pin-fly-in` | pin-fly-in (slide from offset) | 0.4s | Zoom-in or density→places |
| `density-pin-exit` | pin-collapse (scale down) | 0.25s | Generic remove |
| `density-pin-burst` | pin-burst (scale up then fade) | 0.28s | Zoom-in outgoing / density→places outgoing |
| `density-pin-fly-out` | pin-fly-out (slide toward `--merge-dx/dy`) | 0.35s | Zoom-out / places→density |

CSS vars `--fly-dx/dy` (fly-in) and `--merge-dx/dy` (fly-out) set per-marker screen offsets.

### Resolution transitions (`useDensityPinLayer.transitionRes`)
- **Zoom-in**: old pins burst, new child pins fly in from parent screen position (`computeExplodeOffsets`)
- **Zoom-out**: old pins fly toward parent centroid (`computeMergeOffsets`), new parent pins pop in; removal deferred 280ms for animation

### Mode transitions
- **Density → places** (`transitionToPlaces`, first call): density pins burst, place pins fly in from their H3 host tile
- **Places pan** (`transitionToPlaces`, subsequent calls): new IDs only, existing markers persist
- **Places → density** (`transitionFromPlaces`): place pins fly to H3 centroid, new density pins added immediately, places removed after 400ms

---

## 5. Hook architecture

### `usePinAnimations` (orchestrator)
Composes the two layer hooks and exposes a clean API to `DataLayer`:

```ts
{
  currentResRef,        // current H3 resolution (from density layer)
  addPins,              // incremental add on pan (same res)
  transitionRes,        // animated res change
  transitionToPlaces,   // density→places or places-pan
  transitionFromPlaces, // places→density
  clearAll,             // instant wipe of all layers
}
```

### `useDensityPinLayer`
Owns:
- `renderedTilesRef` — Set of H3 tile IDs already in the layer (dedup key)
- `currentResRef` — current resolution
- `markersByTileRef` — Map<tileId, L.Marker>
- `cleanupTimerRef` + `pendingRemovalRef` — deferred removal with cancel-flush safety

Exposes all four refs + `cancelTimer` + `resetState` to the place layer for cross-layer coordination.

### `usePlacePinLayer`
Owns:
- `placeMarkersByIdRef` — Map<placeId, L.Marker>
- `cleanupTimerRef` + `pendingRemovalRef`

Receives `density` (a `DensityRefs` interface) to coordinate cleanup.  
Internally calls `addPlaceMarkers` — **`DataLayer` does not call `addPlaceMarkers` directly**.

---

## 6. DataLayer control flow

```
useEffect fires when `res` changes
│
├── mode === 'tiles'
│   ├── prevMode was 'places' → transitionFromPlaces(res.resolution, res.data)
│   ├── resolution changed    → transitionRes(res.resolution, res.data)
│   └── same resolution       → addPins(res.data, res.resolution)   ← incremental, dedup by tile
│
└── mode === 'places'
    └── transitionToPlaces(res.data)
        ├── first entry (no place markers tracked) → burst density, fly-in places
        └── pan (markers already tracked)          → add new IDs only, persist old ones
```

---

## 7. Bugs fixed in this session (2026-06-12)

### Bug 1 — Orphaned pins on fast zoom (race condition)
**Root cause:** `cancelTimer()` cleared the `setTimeout` but dropped the `outgoing` markers that were waiting in the deferred callback closure. They were already removed from `markersByTileRef` so nothing would ever remove them.

**Fix:** Added `pendingRemovalRef` to both `useDensityPinLayer` and `usePlacePinLayer`. Pending-removal markers are stored there before every `setTimeout`. If `cancelTimer` fires first, it flushes them immediately via `layer.removeLayer()`.

---

### Bug 2 — Place markers accumulating on pan at res 10 (main persisting-pin bug)
**Root cause:** `transitionToPlaces` was called on every API response in places mode, including pans. It had no concept of "already in places mode" — it would call `addPlaceMarkers` for all 100 places every time. The old 100 markers were overwritten in `placeMarkersByIdRef` (so the refs were lost) but remained in the `LayerGroup` with no path to removal.

**Fix:** `transitionToPlaces` now checks `placeMarkersByIdRef.current.size === 0` to detect first-entry vs pan. On pan it only adds place IDs not already tracked — existing markers persist. `addPlaceMarkers` was moved inside `usePlacePinLayer` (DataLayer no longer calls it directly). The now-unnecessary `registerPlaceMarkers` function was removed entirely.

---

### Bug 3 — Density pins orphaned after places→tiles→pan
**Root cause:** `transitionFromPlaces` created density pins using a local `renderedSet = new Set<string>()` but never wrote it back to `density.renderedTilesRef`. So the next `addPins` call saw an empty `renderedTilesRef`, re-created markers for all existing tiles, overwrote `markersByTileRef` with new references, and left the original markers stranded in the layer forever.

**Fix:** `useDensityPinLayer` now exposes `renderedTilesRef`. `transitionFromPlaces` sets `density.renderedTilesRef.current = renderedSet` after adding new density pins, keeping the dedup set in sync.

---

## 8. Current state — what works

- [x] Density pins at H3 res 7, 8, 9 — parametric SVG size based on count
- [x] Place pins at res 10 — dark teal SVG teardrop, popup on click
- [x] Zoom-in transition: burst + child fly-in from parent
- [x] Zoom-out transition: merge fly-out + parent pop-in
- [x] Density → places: burst + fly-in from host tile
- [x] Places → density: fly-out to tile centroid + density pop-in
- [x] Places pan: existing markers persist, new IDs appended
- [x] Density pan (same res): incremental add, already-rendered tiles skipped
- [x] Fast-zoom race condition: pending removals flushed on cancel

---

## 9. Not yet built / possible next steps

- **Side panel / detail card** — `isSideCardVisible` exists in `AppUIContext.tsx` but clicking a place pin doesn't open anything yet. The backend has a `/api/place/{id}` endpoint ready.
- **Filter UI** — `TilesParams` supports `cuisine`, `cost`, `venue_type`, `score_tier`, `confidence` but there is no UI to set them yet.
- **Place marker remove on res change** — when zooming out from res 10, `transitionFromPlaces` handles the animated exit, but zooming back in while in places mode does not currently remove old place markers before adding new ones (would need `transitionToPlaces` first-entry detection to also run when res changes while in places mode — currently `prevModeRef` gates this via `transitionFromPlaces`).
- **Frontend deployment** — only the backend is deployed to Render; frontend runs locally on `http://localhost:5173`.
- **Nearby API endpoint** — `/api/nearby` exists on the backend but is not wired to the frontend.

---

## 10. Backend notes (brief)

- FastAPI on Render.com
- `server/server.py` — app entry point
- `/api/tiles` params: `res: int` (7–10), `places_only: bool`, `zoom: int`, `lat/lng bounds`, `cuisine`, `cost`, `venue_type`, `score_basis`, `confidence`, `score_tier`
- `/api/place/{id}` — detail fetch (not yet wired to frontend)
- Database: Neon (serverless PostgreSQL). Tables: `places`, `h3_density`
- ETL: `server/db/etl_load.py` — run from `server/` with venv active
- Server venv: `server/venv` — activate with `server\venv\Scripts\Activate.ps1`
