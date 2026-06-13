# BubbleAvatar — Design & Implementation Notes

> Created: 2026-06-12 | Last updated: 2026-06-13

---

## Overview

`BubbleAvatar` is an animated drag-and-drop avatar that floats at the **bottom-centre of the viewport**, above the Leaflet map. The user drags it and drops it onto the map to trigger a 500 m radius place query centred on the drop point. Releasing it near its home position springs it back; releasing it off-map also cancels the drop.

Visually it is a frosted-glass circle containing two pill-shaped eyes that blink and glance in random directions — including toward the cursor — giving it an alive, emoji-like character. Once dropped onto the map, a smaller copy of the avatar sits at the drop point as a Leaflet marker, retaining the same eye animations. Various satellite UI elements (home reset ghost and edge indicator) provide feedback while carrying and while the avatar is off-screen.

---

## File Structure

```
src/Page1/components/BubbleAvatar/
│
├── config.ts                          ← shared constants: LatLng, HOME_SNAP_RADIUS, getHomeCenter()
│
├── BubbleAvatarHome/                  ← the draggable home button (Framer Motion)
│   ├── BubbleAvatarHome.tsx           ← component: motion.div drag shell + face + drop-ring
│   ├── BubbleAvatarHome.css           ← fixed positioning, eye shape, drop-ring keyframes
│   └── useHomeProximity.ts            ← hook: fires onNearHomeChange as drag enters/leaves snap zone
│
├── useDragAndDrop/
│   ├── useBubbleDrag.ts               ← hook: Framer Motion drag lifecycle (disable Leaflet, lat/lng conversion)
│   └── useBubbleDrop.ts               ← hook: reactive Leaflet layer manager (circle, avatar pin, place markers)
│
├── useEyeAnimations/
│   ├── useEyeGaze.ts                  ← composer: calls useBlink + useGaze, used by Pin and Home idle mode
│   ├── useBubbleHomeEyes.ts           ← composer: routes between idle (useEyeGaze) and drag (useSmileGaze) eye state
│   ├── useBlink.ts                    ← hook: owns blink cycle (random interval timer loop)
│   ├── useGaze.ts                     ← hook: owns idle gaze direction (cursor tracking + random scheduler)
│   └── useSmileGaze.ts                ← hook: randomised scanning gaze active only while dragging/pickup-pending
│
├── BubbleAvatarPin/                   ← smaller avatar rendered inside a Leaflet DivIcon on the map
│   ├── BubbleAvatarPin.tsx
│   └── BubbleAvatarPin.css
│
├── BubbleHomeGhost/                   ← reset-home control with dashed ring shown while avatar is away from home
│   ├── BubbleHomeGhost.tsx
│   └── BubbleHomeGhost.css
│
├── BubbleEdgeIndicator/               ← speech-bubble at viewport edge when avatar is off-screen
│   ├── BubbleEdgeIndicator.tsx
│   └── BubbleEdgeIndicator.css
│
└── BubbleCarryOverlay/                ← unused; superseded by unified Framer Motion drag (retained for reference)
```

`BubbleAvatar`'s pieces are assembled in `MapCard.tsx`:

```tsx
// MapCard.tsx (simplified)
<Map mapRef={mapRef} searchMask={searchMask} />
<MapToolbar mapRef={mapRef} />
<BubbleAvatar mapRef={mapRef} setSearchMask={setSearchMask} />

// BubbleAvatar owns droppedPos/pickupPos/ghost state internally and pushes
// only searchMask up to MapCard via setSearchMask.
```

---

## State Ownership

Current ownership split:

| Owner | State | Purpose |
|---|---|---|
| `MapCard` | `searchMask: { center, radiusM } \| null` | Mask passed into DataLayer so tile density/place pins inside bubble radius are filtered out |
| `BubbleAvatar` | `droppedPos: LatLng \| null` | Whether avatar is on map and where |
| `BubbleAvatar` | `pickupPos: {x,y} \| null` | Screen coordinate used to remount `BubbleAvatarHome` in pickup mode |
| `BubbleAvatar` | `flyInFrom: {x,y} \| null` | Edge screen coordinate for reset-home fly-in animation; cleared after animation completes |
| `BubbleAvatar` | `isDraggingButton: boolean` | Shows/hides `BubbleHomeGhost` |
| `BubbleAvatar` | `isNearHome: boolean` | Home-snap state used by reset-home ring scale and drag drop-ring suppression |

`BubbleAvatar` publishes `searchMask` upward with a guarded effect:

```tsx
const searchMask = useMemo(
  () => (droppedPos ? { center: droppedPos, radiusM: SEARCH_RADIUS } : null),
  [droppedPos],
);

useEffect(() => {
  setSearchMask(searchMask);
}, [searchMask, setSearchMask]);
```

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

`BubbleAvatarHome` is `position: fixed; bottom: 88px; left: 50%` with `margin-left: -32px` (half of the 64 px diameter). Using a negative margin instead of `translateX(-50%)` keeps Framer Motion's own transform axis clean — if `translateX` were already set in CSS, `dragSnapToOrigin` would fight it.

In **pickup mode**, CSS positioning is overridden inline:
```tsx
const pickupStyle = pickupFrom
  ? { bottom: 'auto', left: pickupFrom.x - 32, top: pickupFrom.y - 32, marginLeft: 0 }
  : undefined;
```
The 32 px offset centres the 64 px circle on the pointer.

---

## Drag Lifecycle (`useBubbleDrag.ts`)

| Event | Behaviour |
|---|---|
| `onDragStart` | `isDragging = true`; `map.dragging.disable()` so Leaflet pan doesn't compete |
| `onDrag` | Updates `dragPos` (used to position the drop-ring overlay) |
| `onDragEnd` — near home | Near-home check runs **first** (see below); calls `onCancel()` to snap back |
| `onDragEnd` — on map | Converts `info.point` to lat/lng via `map.containerPointToLatLng()`; calls `onDrop(lat, lng)` |
| `onDragEnd` — off map | `onCancel()` called; in home mode, Framer Motion's `dragSnapToOrigin` springs the bubble back |

**Critical ordering — near-home check before map-bounds check:**  
The home button sits inside the map container's bounding rect. Without checking home-proximity first, releasing near home would incorrectly register as a map drop. The check order is: near-home → on-map → cancel.

**Key Framer Motion props:**
```tsx
drag
dragControls={dragControls}
dragSnapToOrigin={!pickupFrom}      // only snap home when not in pickup mode
dragElastic={0.12}                   // rubber-band resistance
dragMomentum={false}                 // no coasting after release
dragTransition={{ bounceStiffness: 320, bounceDamping: 28 }}
whileTap={{ scale: 0.88 }}
whileDrag={{ scale: 1.18, boxShadow: '...' }}
```

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

All eye state flows from `useEyeGaze` (composer), called in both `BubbleAvatarHome` and `BubbleAvatarPin`:

```
useEyeGaze(bubbleRef)
  ├── useBlink()          → { isBlinking }
  └── useGaze(bubbleRef)  → { gaze: { x, y } }
```

### `useBlink.ts`
- Owns `isBlinking: boolean`
- Nested `setTimeout` loops: outer schedules next blink (1.8–3.8 s random), inner reopens eyes after 140 ms
- Completely independent — no inputs, no shared state

### `useGaze.ts`
- Owns `gaze: { x, y }` (pixel offsets, max ±4 px)
- Two tightly-coupled concerns kept in one hook because they share `mouseRef` (separating would pass a ref across hook boundaries for no gain):
  1. **Passive cursor tracking** — `window.addEventListener('mousemove', { passive: true })` stores position in a `ref` (zero re-renders)
  2. **Random gaze scheduler** — fires every 1.4–4.2 s; rolls:
     - 40% → look at cursor
     - 18% → glance left
     - 18% → glance right
     - 12% → glance down
     - 12% → centre
- Cursor-to-gaze: unit vector from bubble rect centre to mouse, scaled by `min(1, dist / 120)` so movement is subtler up close

### Eye state → `scaleY` on `motion.div`

| Condition | scaleY |
|---|---|
| Dragging (home button) | 1.4 — wide-eyed |
| Blinking | 0.08 — squished closed |
| Normal | 1.0 |

Right eye has a 40 ms `delay` on blink close only, producing a natural sequential blink.

In `BubbleAvatarPin`, the wide-eyed state is not applied (avatar is stationary on the map). Gaze travel is multiplied by 0.6 to match the smaller pin size.

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

- `BubbleCarryOverlay/` — dead code folder, superseded by unified Framer Motion drag. Safe to delete from the filesystem.
- `useBubbleDrop` disables `map.dragging` on avatar `pointerdown` to win gesture arbitration against Leaflet pan-detection. This is intentional; pan is restored in release handlers, long-press handoff, and cleanup as defense in depth.
- `config.ts` — `BubbleAvatar.ts` barrel file exists but is currently empty; imports come directly from sub-paths.

---

## Session Log (2026-06-13)

Detailed record of what happened in this debugging/finalization session.

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
| Blink interval | `useEyeAnimations/useBlink.ts` | 1.8–3.8 s | Less frequent blinks |
| Blink closed duration | `useEyeAnimations/useBlink.ts` | 140 ms | Slower blink |
| Gaze interval | `useEyeAnimations/useGaze.ts` | 1.4–4.2 s | Less frequent glances |
| Gaze max travel | `useEyeAnimations/useGaze.ts` `MAX_OFFSET` | 4 px | Wider eye movement |
| Gaze full-travel distance | `useEyeAnimations/useGaze.ts` | 120 px | Later reaching full travel |
| Drag snap stiffness | `BubbleAvatarHome/BubbleAvatarHome.tsx` | 320 | Faster spring-back |
| Drag snap damping | `BubbleAvatarHome/BubbleAvatarHome.tsx` | 28 | Less bounce on snap |
| Drag elastic | `BubbleAvatarHome/BubbleAvatarHome.tsx` | 0.12 | More rubber-band feel |
| Search radius | `config.ts` `SEARCH_RADIUS` | 500 m | Larger masked/search area |
| Avatar press delay | `config.ts` `LONG_PRESS_MS` | 150 ms | Harder to trigger pickup |

---

## Next Steps (optional)

- Delete `BubbleCarryOverlay/` from filesystem to finish dead-code cleanup.
- If needed, move `SearchMask` type to `BubbleAvatar/config.ts` so `MapCard`, `Map`, and `DataLayer` import one shared type.
- Consider replacing the `setTimeout(..., 0)` teardown with a small root-manager utility if future React strict/concurrent behavior changes.
