# MapLibre 3D Migration Notes

## Current Setup

The basemap lives in `src/MapPage/components/Map/BaseLayer/BaseLayer.ts`.

- Map engine: **Leaflet** (`L.map`)
- Basemap: OpenFreeMap `liberty` style via the **MapLibre GL Leaflet bridge** (`@maplibre/maplibre-gl-leaflet`)
- Style URL: `https://tiles.openfreemap.org/styles/liberty` (or `fiord` depending on what the user last set)
- Data overlays: rendered by Leaflet via `DataLayer.ts` (canvas renderer, place pins, heat map, H3 grid)

---

## OpenFreeMap "3D" — What It Actually Is

The quick-start page's "3D" button does **not** use a separate 3D tile service. Inspecting
`https://openfreemap.org/scripts/map.js` reveals:

```js
// The style URL is still the standard Liberty style
const styleUrl = `https://tiles.openfreemap.org/styles/${style.split('-')[0]}`
// e.g. for "liberty-3d" → https://tiles.openfreemap.org/styles/liberty

// 3D is just a MapLibre camera configuration:
const london3d = {
  center: [-0.114, 51.506],
  zoom: 14.2,
  bearing: 55.2,
  pitch: 60,
}
map.setStyle(styleUrl)
map.setCenter(london3d.center)
map.setPitch(london3d.pitch)
map.setBearing(london3d.bearing)
map.setZoom(london3d.zoom)
map.dragRotate.enable()
```

**Conclusion:** "3D" = standard Liberty style + MapLibre camera pitch (60°) + bearing (55.2°) + drag-rotate enabled. No separate URL or tile format required.

---

## Why Leaflet Cannot Do Real 3D

The `@maplibre/maplibre-gl-leaflet` bridge embeds a MapLibre canvas inside a Leaflet layer. MapLibre camera methods (`setPitch`, `setBearing`, `dragRotate`) are **not exposed** through the bridge. Leaflet controls the viewport; the MapLibre instance underneath is locked to 0° pitch/bearing.

To replicate the OpenFreeMap 3D experience, the app needs a **native `maplibregl.Map`** as the top-level map object.

---

## Migration Scope

### What would need to change

| Component | Current | After migration |
|---|---|---|
| `BaseLayer.ts` | `L.map` + `maplibre-gl-leaflet` bridge | `maplibregl.Map` directly |
| `DataLayer.ts` | Leaflet Canvas renderer, `L.Marker`, `L.circleMarker`, `L.heat` | MapLibre `addSource` / `addLayer` (GeoJSON) or keep Leaflet overlays on a separate HTML pane |
| `usePlacePinLayer.ts` | Leaflet markers + animation logic | MapLibre symbol/circle layers with feature-state or HTML markers via `maplibregl.Marker` |
| `useDensityPinLayer.ts` | Leaflet canvas heatmap | MapLibre heatmap layer |
| `IPLocationHandler.ts` | `map.flyTo(L.LatLng)` | `map.flyTo({ center: [lng, lat] })` |
| `GeoSearchHandler.ts` | Leaflet `fitBounds` | MapLibre `fitBounds` (same concept, different API) |
| `mapRef` type | `React.RefObject<L.Map \| null>` | `React.RefObject<maplibregl.Map \| null>` — cascades to MapPage, BubbleAvatar, PullDownPanel, RestaurantInfoPanel, DataLayer |
| `LONDON_BOUNDS` | `L.LatLngBounds` | MapLibre `LngLatBoundsLike` (`[[sw_lng, sw_lat], [ne_lng, ne_lat]]`) |

### What stays the same

- Style URL: `https://tiles.openfreemap.org/styles/liberty` (no API key)
- Zoom levels, center coords — values are identical, only the API calls differ
- All non-map React components (panels, filters, context) are unaffected

---

## 3D Camera Settings to Apply

```ts
const map = new maplibregl.Map({
  container: mapContainerRef.current,
  style: 'https://tiles.openfreemap.org/styles/liberty',
  center: [-0.114, 51.506],   // London
  zoom: 14.2,
  pitch: 60,                  // degrees of tilt (0 = top-down)
  bearing: 55.2,              // compass rotation in degrees
  dragRotate: true,
  attributionControl: false,
  minZoom: LONDON_MIN_ZOOM,
  maxZoom: LONDON_MAX_ZOOM,
  maxBounds: [[-0.6, 51.2], [0.4, 51.8]],  // approximate London bounds as LngLatBoundsLike
});
```

Or start flat (as the app currently behaves) and let the user rotate into 3D:

```ts
pitch: 0,
bearing: 0,
dragRotate: false,   // enable when user opts in
```

---

## Packages

All necessary packages are already installed:

- `maplibre-gl` ✅ (in `dependencies`)
- `@maplibre/maplibre-gl-leaflet` ✅ (no longer needed after migration)
- `leaflet` and `leaflet.heat` — still needed if Leaflet overlays are kept in a hybrid approach

---

## Decision Point

| Option | Effort | 3D support | Risk |
|---|---|---|---|
| **A. Keep Leaflet, no 3D** | None | No pitch/bearing | No risk |
| **B. Keep Leaflet, fake 3D** | Low | Cosmetic only | None |
| **C. Migrate to MapLibre** | High | Full pitch/bearing/rotation | Rewrites DataLayer and all map refs |
| **D. Hybrid: MapLibre base + Leaflet overlay pane** | Medium | Basemap 3D only | Overlay sync complexity |

Option **C** is the cleanest long-term path and gives identical tile data (same OpenFreeMap style) with full 3D camera control.
