# BubbleAvatar — Design & Implementation Notes

> Created: 2026-06-12 | Last updated: 2026-06-21

---

## Overview

`BubbleAvatar` is an animated drag-and-drop avatar that floats at the **bottom-centre of the viewport**, above the Leaflet map. The user drags it and drops it onto the map to trigger a 500 m radius place query centred on the drop point. Releasing it near its home position springs it back; releasing it off-map also cancels the drop.

Visually it is a frosted-glass circle containing two pill-shaped eyes that blink and glance in random directions — including toward the cursor — giving it an alive, emoji-like character. Once dropped onto the map, a smaller copy of the avatar sits at the drop point as a Leaflet marker, retaining the same eye animations. Various satellite UI elements (home reset ghost and edge indicator) provide feedback while carrying and while the avatar is off-screen.

---

## File Structure

```
src/MapPage/components/BubbleAvatar/
│
├── BubbleAvatar.tsx                   ← root component: assembles all sub-components; wraps children in BubbleAvatarStateProvider
├── BubbleAvatar.css                   ← CSS custom properties scope (.bubble-avatar-root): sizes, colours, shadows
├── BubbleAvatarStateContext.tsx       ← shared state context: droppedPos, pickupPos, isDragging, isNearHome, flyInFrom + all handlers
├── config.ts                          ← shared constants: LatLng, HOME_SNAP_RADIUS, getHomeCenter(), SEARCH_RADIUS, etc.
├── cssCustomProperties.ts             ← generic helper: readCssCustomProperties() — reads CSS vars from a scoped probe element
│
├── BubbleAvatarHome/                  ← the draggable home button (Framer Motion)
│   ├── BubbleAvatarHome.tsx           ← component: motion.div drag shell; reads context; delegates all concerns to hooks
│   ├── BubbleAvatarHome.css           ← fixed positioning, drop-ring keyframes
│   └── hooks/                         ← all BubbleAvatarHome-specific hooks
│       ├── useBubbleFlightAnimation.ts ← computes Framer Motion initial/animate/transition for fly-in and fly-out
│       ├── useBubbleStyle.ts           ← returns bubbleStyle CSSProperties from a style keyword (default|pickup|raw-drag)
│       ├── useCoarsePointer.ts         ← detects (pointer: coarse) and listens for changes
│       ├── useHomeProximity.ts         ← fires onNearHomeChange as drag enters/leaves home snap zone
│       ├── usePickupBootstrap.ts       ← bootstraps Framer or raw drag on pickup; resolves pointer-up fallback
│       ├── useRawPointerDrag.ts        ← raw pointer event drag path used on coarse/touch pointers
│       └── useResolvePickupWithoutDrag.ts ← resolves pickup drop if Framer drag never started
│
├── BubbleEyes/                        ← eye rendering and animation
│   ├── BubbleEyes.tsx                 ← component: renders both eye motion.divs; accepts pre-computed eye state
│   ├── BubbleEyes.css
│   ├── useBubbleHomeEyes.ts           ← composer: routes between idle and drag eye state for BubbleAvatarHome
│   ├── useEyeGaze.ts                  ← composer: calls useBlink + useIdleGaze; used by Pin and Home idle mode
│   ├── useBlink.ts                    ← hook: owns blink cycle (random interval timer loop)
│   ├── useIdleGaze.ts                 ← hook: idle gaze direction (cursor tracking + random scheduler)
│   ├── useCuriousGaze.ts              ← hook: cursor-tracking variant of gaze
│   └── useSmileGaze.ts                ← hook: randomised scanning gaze active only while dragging/pickup-pending
│
├── useDragAndDrop/
│   ├── useBubbleDrag.ts               ← hook: Framer Motion drag lifecycle (disable Leaflet, lat/lng conversion)
│   ├── useBubbleDrop.ts               ← hook: reactive Leaflet layer manager (circle, avatar pin, place markers)
│   └── getPinSizeFromCss.ts           ← reads --bubble-avatar-home-size × --bubble-avatar-pin-scale from CSS
│
├── handleUserLocation/
│   ├── useHandleUserLocation.ts       ← composer: wires map pan and bubble flight for auto-location flow
│   ├── useMapPanToLocation.ts         ← hook: watches location trigger, pans map, emits targetLatLng + flight token
│   └── useFlyBubbleToLocation.ts      ← hook: converts target lat/lng to screen coords, drives fly-out + drop
│
├── Searchmask/
│   ├── useUpdateSearchMask.ts         ← hook: pushes droppedPos → searchMask into SearchFiltersContext
│   └── DashedCircle.tsx               ← reusable SVG dashed ring (drop-ring overlay, pickup-pending indicator)
│
├── BubbleAvatarPin/                   ← smaller avatar rendered inside a Leaflet DivIcon on the map
│   ├── BubbleAvatarPin.tsx
│   └── BubbleAvatarPin.css
│
├── BubbleHomeGhost/                   ← reset-home control shown while avatar is away from home
│   ├── BubbleHomeGhost.tsx
│   └── BubbleHomeGhost.css
│
├── BubbleEdgeIndicator/               ← speech-bubble at viewport edge when avatar is off-screen
│   ├── BubbleEdgeIndicator.tsx
│   └── BubbleEdgeIndicator.css
│
└── DashedCircle/                      ← (legacy path; canonical version now in Searchmask/)
```

`BubbleAvatar` is assembled inside `MapPage.tsx`, wrapped in `BubbleAvatarStateProvider`:

```tsx
// MapPage.tsx (simplified)
<BubbleAvatarStateProvider>
  <BubbleAvatar mapRef={mapRef} />
</BubbleAvatarStateProvider>
```

---

## State Ownership

All BubbleAvatar state is now centralised in `BubbleAvatarStateContext` and consumed via `useBubbleAvatarState()`. `MapPage` wraps `BubbleAvatar` in `BubbleAvatarStateProvider`.

| Owner | State | Purpose |
|---|---|---|
| `BubbleAvatarStateContext` | `droppedPos: LatLng \| null` | World coordinates of current drop |
| `BubbleAvatarStateContext` | `pickupPos: Point \| null` | Screen coordinate for pickup-mode remount |
| `BubbleAvatarStateContext` | `isDragging: boolean` | Whether the avatar is actively being dragged |
| `BubbleAvatarStateContext` | `isNearHome: boolean` | Home-snap proximity, drives ghost ring scale and drop-ring suppression |
| `BubbleAvatarStateContext` | `flyInFrom: Point \| null` | Source screen position for reset fly-in animation |
| `SearchFiltersContext` | `searchMask` | Avatar drop position pushed into global filter context via `useUpdateSearchMask` |

`searchMask` is no longer lifted to `MapPage` props — `useUpdateSearchMask` writes it directly into `SearchFiltersContext`, removing the prop-drilling chain that previously went through `MapCard → Map → DataLayer`.

---

## Package: Framer Motion

**Framer Motion** (`framer-motion`) was added specifically for this feature.
It provides:
- Spring-physics drag with a single `drag` prop
- `dragSnapToOrigin` — automatic spring-back when released off-map (disabled in pickup mode, since there is no home to snap back to)
- `useDragControls` + `dragControls.start()` — programmatic drag start used when picking up from the map (the pointer is already held down mid-gesture)
- `whileTap` / `whileDrag` — declarative press/lift feedback
- Per-property `transition` on `animate` — used for eye movement (spring on x/y, tween on scaleY)

---

## Positioning

`BubbleAvatarHome` is `position: fixed; bottom: var(--bubble-avatar-bottom-offset); left: 50%` centred with `margin-left: calc(var(--bubble-avatar-home-size) / -2)`. Using a negative margin instead of `translateX(-50%)` keeps Framer Motion's own transform axis clean.

All sizing tokens come from CSS custom properties on `.bubble-avatar-root` in `BubbleAvatar.css`:

| Token | Default | Use |
|---|---|---|
| `--bubble-avatar-home-size` | 80 px | Home button diameter |
| `--bubble-avatar-pin-scale` | 0.625 | Pin size as a fraction of home size |
| `--bubble-avatar-bottom-offset` | 56 px | Fixed bottom offset |
| `--bubble-avatar-drop-ring-size` | 120 px | Drop-ring SVG viewport |

In **pickup mode** and **raw drag mode**, the inline style is computed by `useBubbleStyle` and always uses the CSS variable for centering:

```tsx
left: `calc(${pos.x}px - (var(--bubble-avatar-home-size) / 2))`
top:  `calc(${pos.y}px - (var(--bubble-avatar-home-size) / 2))`
```

This means the centering adapts automatically if the CSS token changes (e.g. for different viewport sizes), with no JS changes needed.

`getPinSizeFromCss()` (in `useDragAndDrop/`) reads `--bubble-avatar-home-size × --bubble-avatar-pin-scale` at drop time via `readCssCustomProperties()` to compute the Leaflet `iconSize`. The generic `readCssCustomProperties(propertyNames, { scopeClassName, fallbackValues })` helper lives in `cssCustomProperties.ts` and can be reused anywhere CSS vars need to be read from a class scope.

---

## Drag Lifecycle (`useBubbleDrag.ts`)

| Event | Behaviour |
|---|---|
| `onDragStart` | `isDragging = true` (context); `map.dragging.disable()` |
| `handleDragStartAtPoint(x,y)` | Same as above, also sets `dragPos` — used by raw drag path |
| `onDrag` | Updates `dragPos` (used to position the drop-ring overlay) |
| `onDragEnd` — near home | Near-home check runs **first**; calls `onCancel()` to snap back |
| `onDragEnd` — on map | Converts `info.point` to lat/lng; calls `onDrop(lat, lng)` |
| `onDragEnd` — off map | `onCancel()` called; Framer Motion's `dragSnapToOrigin` springs back |

**Critical ordering — near-home check before map-bounds check:**  
The home button sits inside the map container's bounding rect. Without checking home-proximity first, releasing near home would incorrectly register as a map drop.

**Key Framer Motion props:**
```tsx
drag
dragControls={dragControls}
dragSnapToOrigin={!pickupPos}
dragElastic={isCoarsePointer ? 0.02 : 0.12}
dragMomentum={false}
dragTransition={{ bounceStiffness: 320, bounceDamping: 28 }}
whileTap={{ scale: isCoarsePointer ? 0.96 : 0.88 }}
whileDrag={whileDragVisual}   // coarse: subtle lift; fine: larger scale + deep shadow
```

## Coarse Pointer / Raw Drag Path

On touch/coarse-pointer devices, Framer Motion drag events are unreliable. `useCoarsePointer` detects `(pointer: coarse)` and listens for changes. When `rawDragEnabled` is true:

- `drag={false}` — Framer drag is disabled on the `motion.div`.
- `onPointerDown` starts `useRawPointerDrag`, which tracks `pointermove`/`pointerup`/`pointercancel` on `window` using `pointerId` for correct multi-touch isolation.
- `handleDragStartAtPoint(x, y)` is called instead of `handleDragStart` so `isDragging` and `dragPos` are set correctly from the first point.
- `bubbleStyle` uses the `'raw-drag'` keyword so the element is positioned absolutely under the pointer during drag.
- Visual feedback (scale, shadow) uses the coarse variant in `whileDragVisual`.

## Pickup Bootstrap (`usePickupBootstrap.ts`)

When `pickupPos` is set (map avatar long-pressed), `BubbleAvatarHome` remounts at that screen coordinate. `usePickupBootstrap` then:

1. **Framer path**: fires `dragControls.start(new PointerEvent(...))` in a `requestAnimationFrame` to resume the already-held gesture.
2. **Raw path**: calls `startRawDrag(pickupPos.x, pickupPos.y)` immediately.
3. **Fallback**: if neither drag path started before `pointerup`, calls `resolvePickupWithoutDrag` so the avatar is never left hovering.
4. **Guard reset**: `firedPickupRef` is reset to `false` whenever `pickupPos` clears, so subsequent pickups bootstrap correctly.

## Bubble Style (`useBubbleStyle.ts`)

The caller chooses a style keyword outside the hook:

```tsx
const styleKeyword = rawDragEnabled && isDragging && dragPos
  ? 'raw-drag' : pickupPos ? 'pickup' : 'default';
const bubbleStyle = useBubbleStyle({ styleKeyword, pickupPos, dragPos });
```

| Keyword | Result |
|---|---|
| `'default'` | `undefined` — CSS handles fixed positioning |
| `'pickup'` | `position: fixed` at `pickupPos`, CSS-variable centering |
| `'raw-drag'` | `position: fixed` at `dragPos`, CSS-variable centering |

---

## Drop-Ring Overlay

While dragging, a pulsing dashed ring follows the cursor (`@keyframes drop-ring-pulse` in CSS). It is a separate `div` rendered conditionally — `position: fixed` at `dragPos.x / dragPos.y`, centred via `translate(-50%, -50%)`.

When the drag enters the home snap zone (`isNearHome === true`), this pulsing ring is intentionally hidden so the home-target reset ring remains the primary visual cue.

During map-avatar pickup, there is also a short **pickup-pending** phase (pickup acquired but Framer drag has not emitted `onDragStart` yet). In that phase the same drop-ring is rendered at `pickupFrom` so the user gets immediate feedback that drag mode is active.

---

## Map Drop (`useBubbleDrop.ts`)

Reactive hook: watches `droppedPos`. On any change (or when the component unmounts), the `useEffect` cleanup clears all Leaflet layers. When `droppedPos` is set it:

1. **Zooms** the map to zoom level 15 at the drop coordinates (animated).
2. **Draws a dashed 500 m circle** — `L.circle` with `dashArray: '10 8'` on a canvas renderer (canvas supports `dashArray` natively without an SVG renderer).
3. **Mounts `BubbleAvatarPin`** as a 40×40 px Leaflet `L.divIcon` via `ReactDOM.createRoot()` — the map avatar retains blinking and gaze animations at 60% travel multiplier for its smaller size.
4. **Long-press pickup** on the map avatar (150 ms threshold):
   - `preventDefault` + `setPointerCapture` + immediate `map.dragging.disable()` called on `pointerdown` to win the gesture race against Leaflet's pan detection. Deferring to the timer gives Leaflet a 150 ms window to claim the gesture.
   - On release (short tap or cancel) `map.dragging.enable()` is restored.
   - On confirmed long-press: calls `onPickup(x, y)` → MapCard clears `droppedPos` and sets `pickupPos`.
5. **Fetches nearby places** using shared `useRequestNearby` (`/api/nearby?lat=&lng=&radius_m=500`). Results are rendered via `addPlaceMarkers` in a `L.layerGroup`.

**Search circle entry animation:**  
The circle is added with `radius: 1` and `opacity: 0` so it is invisible from the first render frame. `startCircleIn()` fires after `entryDelayMs` and drives a `rAF` loop over `CIRCLE_ENTRY_MS` (280 ms) with cubic ease-out on both radius and opacity. If the map is already at `ZOOM_LEVEL` the delay is 0; otherwise `DROP_ENTRY_DELAY_MS` (200 ms, in `config.ts`) is applied so the ring doesn't appear while the zoom animation is still running.

**Place marker stagger:**  
Markers are sorted radially from the drop centre and each receives an `animation-delay` of `i × 28 ms` (capped at the 20th pin), reusing the same `density-pin-enter` / `density-pin-fly-in` CSS classes as density pins. The same `entryDelayMs` is added as a base offset so the cascade starts after the zoom settles.

**Teardown behavior (current):** cleanup captures refs, nulls them, then tears layers down in `setTimeout(..., 0)`:
- Avoids "Attempted to synchronously unmount a root while React was already rendering" when drop/pickup state changes rapidly.
- `map.dragging.enable()` is also called defensively in long-press handoff and cleanup, preventing pan-lock if marker is removed before `pointerup`.

**Z-order rule:** avatar marker uses `zIndexOffset: 10000`, so it stays above place pins.

---

## Home Ghost / Reset (`BubbleHomeGhost.tsx`)

`BubbleHomeGhost` is now a single reset-home control (`motion.button`) rendered at the fixed home position whenever the avatar is away from home.

- Contains a dashed ring and `ReplayRoundedIcon`
- Calls `onResetHome` on tap/click from any away-from-home state
- Uses spring scale animation on the dashed ring (`1.0 ↔ 1.16`) driven by `isNearHome`
- Layered below the active avatar (`z-index: 1099` vs home avatar `z-index: 1100`)

---

## Home Proximity (`useHomeProximity.ts`)

Extracted hook that owns the near-home detection logic.

- Inputs: `isDragging`, `dragPos`, `onNearHomeChange?`
- Single `useEffect` — computes Euclidean distance to `getHomeCenter()` on every `dragPos` update; fires `onNearHomeChange` only on transitions (via `prevRef`) to avoid unnecessary renders
- Resets to `false` automatically when `isDragging` becomes false

---

## Edge Indicator (`BubbleEdgeIndicator.tsx`)

Shown when the map avatar is off-screen. Computes position by tracing a ray from the **viewport centre** toward the avatar's projected screen coordinates and finding where it intersects the viewport boundary. The result gives both the clamped screen position and which edge was hit (used to orient the CSS speech-bubble tail).

| Interaction | Behaviour |
|---|---|
| Tap / click | `map.setView()` to the avatar's lat/lng at zoom 16 |
| Long press (`LONGPRESS_MS` ms) | Calls `onPickup(x, y)` — same state transition as a map-avatar long-press |

Stable `useRef` wrappers for `onPickup` and `edgeState` prevent map `move` listeners from being re-registered on every render.

**Fly-in animation:**  
When `BubbleAvatarHome` is remounted with a `flyInFrom` prop, the `motion.div` starts at the offset from `flyInFrom` to the home centre and springs to `(0, 0)` (`stiffness: 280, damping: 24`) while fading in. The `onFlyInComplete` callback clears `flyInFrom` after the first completion to prevent re-triggering.

---

## Eye Animation Architecture

Eye rendering is now split between `BubbleEyes/` (component + hooks) and `BubbleAvatarHome` (which imports it as a sub-component):

```
BubbleEyes/
  BubbleEyes.tsx           ← motion.div pair; accepts pre-computed eye state props
  useBubbleHomeEyes.ts     ← composer: routes idle vs drag eye state
  useEyeGaze.ts            ← composer: calls useBlink + useIdleGaze
  useBlink.ts              ← owns blink cycle (random interval loop)
  useIdleGaze.ts           ← cursor tracking + random gaze scheduler
  useCuriousGaze.ts        ← cursor-tracking-only gaze variant
  useSmileGaze.ts          ← random scanning gaze for drag/pickup-pending state
```

`BubbleAvatarHome` renders `<BubbleEyes />` as a self-contained sub-component, keeping eye concerns out of the drag shell entirely.

---

## DataLayer Search Masking

`Map.tsx` passes `searchMask` down to `DataLayer`.

`DataLayer` now masks by radius instead of globally suppressing all pins:
- `filterDensityOutsideMask(...)` removes only density tiles whose H3 centroid is within `searchMask.radiusM`.
- `filterPlacesOutsideMask(...)` removes tile-API place markers within the same radius.

This achieves two goals:
1. Keep region density pins visible outside the bubble radius.
2. Avoid duplicate place markers inside the bubble (tile places vs. nearby places from BubbleAvatar).

When mask changes (drop/move/clear), `DataLayer` forces a reconcile via `transitionRes(...)` so already-rendered in-radius density pins are actually removed, not just blocked from future adds.

---

## Unified Drag Experience

Early development used raw Pointer Events for map-avatar pickup (a separate `useMapPickup` hook). This created two divergent drag experiences. Both are now unified under Framer Motion:

- **Home drag**: user picks up `BubbleAvatarHome` directly
- **Map pickup**: long-press fires `onPickup(x, y)` → MapCard sets `pickupPos` → `BubbleAvatarHome` re-mounts at that screen coordinate with `pickupFrom` set → `dragControls.start(new PointerEvent(...))` programmatically resumes the already-held gesture in `requestAnimationFrame`

The `key={pickupPos ? 'pickup' : 'home'}` prop on `BubbleAvatarHome` forces React to mount a fresh Framer Motion instance on mode switch, so all internal motion values reset cleanly.

`dragSnapToOrigin={!pickupFrom}` — snap-back is only active in home mode. In pickup mode there is no home position to return to; off-map release calls `onDropCancel()` which clears `pickupPos` and the button jumps back to its fixed home.

---

## Known Issues / Future Work

- `useBubbleDrop` disables `map.dragging` on avatar `pointerdown` to win gesture arbitration against Leaflet pan-detection. Pan is restored in release handlers, long-press handoff, and cleanup as defense in depth.
- `readCssCustomProperties` is called once per drop event, not continuously — no performance concern in practice. If CSS vars could change dynamically (e.g. theme switches), a cached/reactive version should be considered.
- `DashedCircle` exists in two locations (`Searchmask/` and legacy `DashedCircle/`). The canonical version is in `Searchmask/`; the legacy folder can be removed once all imports are updated.

---

## Session Log (2026-06-21) — Architecture Refactor

### Shared state extracted to context

`BubbleAvatarStateContext` was introduced to centralise all shared bubble state (`droppedPos`, `pickupPos`, `isDragging`, `isNearHome`, `flyInFrom`) and handlers. `BubbleAvatarStateProvider` wraps `BubbleAvatar` in `MapPage`. All previously prop-drilled state is now consumed via `useBubbleAvatarState()`.

### searchMask moved to SearchFiltersContext

`searchMask` is no longer lifted to `MapPage`. `useUpdateSearchMask` writes it directly into `SearchFiltersContext`, eliminating the `MapCard → BubbleAvatar` prop pair.

### BubbleAvatarHome concerns extracted to hooks/

All inline logic in `BubbleAvatarHome.tsx` was incrementally extracted into focused hooks under `BubbleAvatarHome/hooks/`:

| Hook | Concern |
|---|---|
| `useBubbleFlightAnimation` | Framer Motion initial/animate/transition for fly-in and fly-out |
| `useBubbleStyle` | CSS positioning style based on style keyword input |
| `useCoarsePointer` | `(pointer: coarse)` media query state + listener |
| `useHomeProximity` | Near-home distance check, fires callback on transitions only |
| `usePickupBootstrap` | Framer/raw drag start on pickup; pointer-up fallback; guard reset |
| `useRawPointerDrag` | Raw pointer event drag lifecycle for touch devices |
| `useResolvePickupWithoutDrag` | Resolves drop if Framer drag never fired before release |

### Mobile pickup regression identified and fixed

After extracting `useRawPointerDrag`, `startRawDrag` was calling `handleDragMoveToPoint` instead of `handleDragStartAtPoint`. This meant `isDragging` was never set to `true` on mobile, breaking the entire coarse-pointer drag path. Fixed by adding `handleDragStartAtPoint` to the hook signature and calling it from `startRawDrag`.

Also fixed: `firedPickupRef` in `usePickupBootstrap` was never reset between pickup cycles, silently breaking any second pickup. A `useEffect` on `pickupPos` now resets the guard when pickup mode clears.

### Bubble centering uses CSS variables

The hardcoded `32px` centering offset in `pickupStyle` and `rawDragStyle` was replaced with:
```
calc(Xpx - (var(--bubble-avatar-home-size) / 2))
```
This makes positioning correct across viewport sizes if the CSS token changes.

### Eye rendering extracted to BubbleEyes/

Eye `motion.div` rendering was moved out of `BubbleAvatarHome` into a dedicated `BubbleEyes` component. Eye animation hooks were reorganised under `BubbleEyes/`. `BubbleAvatarHome` now renders `<BubbleEyes />` as a sub-component.

### Pin size reads from CSS

`useBubbleDrop` previously had a hardcoded `PIN_SCALE = 0.625`. This is now computed at drop time by `getPinSizeFromCss()`, which reads `--bubble-avatar-home-size` and `--bubble-avatar-pin-scale` from a probe element. The underlying probe logic was extracted into a generic reusable helper `readCssCustomProperties()` in `cssCustomProperties.ts`.

### Fly-out / auto-location wiring

`handleUserLocation/` was introduced to decouple the user-location flow from `BubbleAvatar.tsx`:
- `useMapPanToLocation` watches a location trigger, pans the map, and emits a `programmaticFlightToken` to prevent repeated flights.
- `useFlyBubbleToLocation` converts the target lat/lng to screen coordinates and drives the bubble fly-out animation + auto-drop.
- `useHandleUserLocation` composes both and returns only what `BubbleAvatar.tsx` needs.

---

## Session Log (2026-06-13)

### 1. Documentation + API location audit

- Confirmed nearby places request path used by BubbleAvatar is inside `useBubbleDrop.ts`.
- Traced full chain:
  - `useBubbleDrop` → `useRequestNearby` (shared request hook) → `/api/nearby`
  - response rendered through `addPlaceMarkers`.

### 2. Refactor to shared nearby request hook

- Replaced inline manual fetch in `useBubbleDrop` with `useRequestNearby`.
- Kept layer rendering local (`addPlaceMarkers`) but delegated request lifecycle/caching to shared hook.

### 3. DataLayer behavior change request: mask-in-radius, not global clear

Requested behavior:
- Keep region density pins outside search circle.
- Hide only those inside search circle.
- Avoid tile-place marker double-up inside circle.

Implemented:
- `MapCard` now owns `searchMask` state and passes it to `Map`.
- `Map` threads `searchMask` into `DataLayer`.
- `DataLayer` filters tiles/places by distance to mask center.
- Added mask-change reconcile path so existing in-radius density markers are removed.

### 4. React max-depth loop (BubbleAvatar)

Error observed:
- `Maximum update depth exceeded` at `BubbleAvatar.tsx`.

Root cause:
- `setSearchMask(...)` was being called from render/effect with unstable object identity, causing parent-child update churn.

Fix:
- Stabilized `searchMask` with `useMemo` on `droppedPos`.
- Kept effect-based upward publish to `setSearchMask`.

### 5. Concurrent unmount warning during drag/drop

Error observed:
- `Attempted to synchronously unmount a root while React was already rendering`.

Root cause:
- `reactRoot.unmount()` in `useBubbleDrop` cleanup could run synchronously during React commit transitions.

Fix:
- Cleanup now snapshots refs, nulls them, then unmounts/removes layers in `setTimeout(..., 0)`.

### 6. Avatar layering request

Requested behavior:
- Avatar always in front of place pins.

Fix:
- Avatar marker now created with `zIndexOffset: 10000`.

### 7. Pickup edge case: hover stuck + map pan lock

Observed behavior:
- Picking avatar without moving could leave avatar hovering and map unpannable.

Root cause:
- On long-press, `map.dragging.disable()` happens at `pointerdown`.
- Marker can be removed before `pointerup`/`pointercancel`, so re-enable handler may never fire.

Fix:
- Re-enable map dragging in long-press handoff right before `onPickup(...)`.
- Re-enable again in cleanup as defensive fallback.

### 8. Regression introduced and reverted

Regression:
- Added fallback timer in `BubbleAvatarHome` to auto-cancel pickup if synthetic drag did not start quickly.
- In practice this over-fired and teleported avatar back home on legitimate pickup.

Resolution:
- Removed fallback timer entirely.
- Kept only robust map-drag re-enable safeguards in `useBubbleDrop`.

### 9. Current stable behavior at end of session

- Dropped avatar renders above place pins.
- Search circle radius masks DataLayer density/places only inside radius.
- Existing in-radius density pins reconcile out on mask changes.
- Nearby markers come from `/api/nearby` via shared hook.
- Pickup no longer globally locks map pan.
- Teleport-to-home regression removed.

### 10. Final pickup edge-case fix (same-position release)

Observed issue:
- Long-press pickup from map worked, but if the user released without moving, the avatar could remain floating in pickup mode.

Root cause:
- In rare pointer timing paths, pickup succeeded but Framer drag start did not fire before release, so the normal `onDragEnd` resolution path never ran.

Fix implemented in `BubbleAvatarHome.tsx`:
- Added pickup-pending visual state (`isPickupPending`) so dragging feedback is immediate.
- Added a one-time `window.pointerup` fallback while in pickup mode:
  - If drag never started, resolve release explicitly:
    - near home → `onDropCancel()`
    - over map → compute lat/lng and call `onDrop(...)`
    - off map → `onDropCancel()`
- Refactored this fallback into a dedicated `resolvePickupWithoutDrag(x, y)` callback to reduce duplicate logic.

Result:
- User can long-press map avatar and release at same location without any stuck hovering state.
- Dragging state visuals appear immediately on pickup.

### 11. Home reset ownership merge + near-home visual refinement

Implemented:
- Moved reset-home ownership from `BubbleEdgeIndicator` to `BubbleHomeGhost`.
- `BubbleHomeGhost` now renders the reset icon and dashed ring whenever avatar is away from home.
- Reset can be triggered at any time (on map, dragging, or pickup-pending).

Visual behavior refinements:
- Removed duplicate dashed-home outlines.
- Kept a single dashed ring attached to the reset-home control.
- Restored natural near-home spring feel by animating only the ring scale.
- Suppressed the pulsing drag drop-ring while `isNearHome` is true.

---

## Appendix: Quick Tuning Reference

| Parameter | Location | Current value | Effect of increasing |
|---|---|---|---|
| Blink interval | `BubbleEyes/useBlink.ts` | 1.8–3.8 s | Less frequent blinks |
| Blink closed duration | `BubbleEyes/useBlink.ts` | 140 ms | Slower blink |
| Gaze interval | `BubbleEyes/useIdleGaze.ts` | 1.4–4.2 s | Less frequent glances |
| Gaze max travel | `BubbleEyes/useIdleGaze.ts` `MAX_OFFSET` | 4 px | Wider eye movement |
| Gaze full-travel distance | `BubbleEyes/useIdleGaze.ts` | 120 px | Later reaching full travel |
| Drag snap stiffness | `BubbleAvatarHome/hooks/useBubbleFlightAnimation.ts` | 320 | Faster spring-back |
| Drag snap damping | `BubbleAvatarHome/hooks/useBubbleFlightAnimation.ts` | 28 | Less bounce on snap |
| Drag elastic (fine) | `BubbleAvatarHome/BubbleAvatarHome.tsx` | 0.12 | More rubber-band feel |
| Drag elastic (coarse) | `BubbleAvatarHome/BubbleAvatarHome.tsx` | 0.02 | More rubber-band feel on touch |
| Home button size | `BubbleAvatar.css` `--bubble-avatar-home-size` | 80 px | Larger avatar; auto-updates centering and pin size |
| Pin size scale | `BubbleAvatar.css` `--bubble-avatar-pin-scale` | 0.625 | Larger map pin; auto-updates Leaflet iconSize |
| Search radius | `config.ts` `SEARCH_RADIUS` | 500 m | Larger masked/search area |
| Avatar press delay | `config.ts` `LONGPRESS_MS` | 150 ms | Harder to trigger pickup |
| Drop entry delay | `config.ts` `DROP_ENTRY_DELAY_MS` | 200 ms | Longer wait before circle appears after zoom |

---

## Next Steps (optional)

- Consolidate `DashedCircle` — remove the legacy `DashedCircle/` folder once all imports point to `Searchmask/DashedCircle.tsx`.
- If CSS vars are ever made responsive (e.g. different size at a breakpoint), `getPinSizeFromCss` will automatically pick up the correct computed value since it reads at drop time, not at module load.
- Consider replacing the `setTimeout(..., 0)` teardown in `useBubbleDrop` with a small root-manager utility if future React strict/concurrent behavior changes.
