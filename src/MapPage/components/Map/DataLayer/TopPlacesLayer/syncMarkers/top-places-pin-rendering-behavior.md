# Top Places Pins: Rendering Behavior (Current)

Date: 2026-07-29

## Purpose
Define the current frontend behavior for rendering top-place pins so pan/zoom interactions remain stable while selected pins feel expressive.

## Scope
Applies to:
- Top places request and viewport gating
- Top-place marker synchronization and lifecycle
- Top-place pin visual transitions and selected state behavior
- Cuisine-based icon resolution

## Behavioral Goals
1. Prevent marker flicker while panning/zooming.
2. Reuse markers by id to avoid unnecessary DOM churn.
3. Keep rendering deterministic under fast viewport changes.
4. Keep selected pins visible until unselected.
5. Render cuisine-specific icon imagery with a safe fallback.

## Source of Truth and Request Gating
1. Top places are rendered only from successful responses.
2. A response is applied only when `responseKey === queryKey`.
3. Viewport top places are sticky during in-flight requests; the layer is not cleared on loading.
4. Viewport and bubble top places are merged by id before rendering.
5. Current fetch limit for both viewport and bubble top places is 15.

## Data Shape Used by Pins
Top-place items currently carry:
1. `id`
2. `restaurant_name`
3. `cuisine_type`
4. `lat` / `lon`
5. `normal_1`
6. `rank`

Notes:
1. Bubble-derived top places map missing fields (`restaurant_name`, `cuisine_type`, `normal_1`) to null.
2. Marker identity and lifecycle are always keyed by `id`.

## Marker Identity and Reuse
For each incoming place:
1. If cache contains `place.id`, reuse existing marker instance.
2. Otherwise create marker once and attach click handler once.
3. Update marker position only when lat/lon changed.
4. Re-adding a cached marker clears stale transition classes and restarts enter animation.

## Selected Marker Persistence Rule
The selected top-place marker is persistence-protected:
1. If selected marker drops out of merged payload temporarily, it is kept active and visible.
2. Pending removal timer for selected marker is canceled.
3. Selected marker remains until unselected.

Unselection triggers:
1. Map click on background.
2. Selecting another top-place marker (selected id changes).

## Lifecycle and Cache Semantics
Current defaults:
1. Exit animation delay: 360 ms.
2. Cache TTL: 30 s.

Rules:
1. Inactive markers schedule animated exit before layer removal.
2. Markers not active and older than TTL are pruned from cache.
3. Reappearing ids reuse cached marker instances when available.

## Cuisine Icon Resolution
Pin icon image source is resolved by cuisine type:
1. `TopPlacePin` builds the marker HTML shell.
2. `getCuisineIconSrc` maps `cuisine_type` through `CUISINE_DISPLAY`.
3. Icon files are loaded from `src/assets/icon_cuisines/*.png` via `import.meta.glob`.
4. Missing or unknown cuisine falls back to `unspecified` icon.

## Visual State Layers
Visual structure is intentionally layered:
1. Shell layer: enter/exit animation classes and selected anchor dot.
2. Hover layer: hover scale and selected lift/scale transform.
3. Motion layer: idle float and selected float plus selected bubble background.
4. Image layer: cuisine icon PNG.

## Current Selection Animation Semantics
When selected:
1. Pin lifts upward and scales.
2. Idle float switches to selected float animation.
3. Background bubble behind icon scales in.
4. Anchor dot appears at original map location to indicate source point.

## Non-Goals
1. No marker cache persistence across page reloads.
2. No popup or tooltip rendering for top-place markers.
3. No highlight-tier logic (top-N highlight rules are removed).

## Verification Checklist
1. Pan/zoom with rapid movement:
   - no full overlay flash
   - stale responses do not overwrite current state
2. Marker continuity:
   - same ids are reused without repeated creation
   - re-added cached marker animates in cleanly
3. Selection persistence:
   - selected marker remains visible when temporarily out of merged payload
   - marker exits only after unselect/select-change
4. Cuisine icon behavior:
   - known cuisine types resolve to correct icon
   - missing/unknown cuisine uses fallback icon
