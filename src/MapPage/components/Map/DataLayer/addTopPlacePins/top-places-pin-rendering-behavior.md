# Top Places Pins: Intended Rendering Behavior

Date: 2026-07-10

## Purpose
Define the intended frontend behavior for rendering top-place pins so map interactions feel stable and smooth during pan/zoom.

## Scope
Applies to the top-place overlay pipeline used by:
- Data layer integration and request wiring
- Top-place marker synchronization logic
- Top-place pin visual state transitions

## Behavioral Goals
1. Prevent visible flicker while panning and zooming.
2. Avoid re-rendering the same pin when identity/state has not changed.
3. Keep behavior deterministic when request responses arrive out of order.
4. Keep implementation lightweight (small DOM/class updates over full marker recreation).

## Source of Truth and Request Gating
1. Top places are rendered only from successful responses.
2. A response is applied only when `responseKey === queryKey`.
3. Debounce is applied before requesting.
4. Stale/in-flight request responses must not overwrite newer viewport state.

## No-Flicker Rules
1. Do not clear the top-place layer while a new request is loading.
2. Keep currently displayed markers visible until a newer valid success payload is available.
3. Apply updates incrementally (diff-based), not by full clear-and-rebuild.

## Marker Identity and Reuse
Marker identity is keyed by `place.id`.

For each incoming place item:
1. If marker exists in cache for the same `place.id`, reuse that marker instance.
2. If marker does not exist, create a new marker and add it once.
3. Bind click handler only when marker is newly created.

## Update-Only-When-Changed Rules
For reused markers:
1. Position: call `setLatLng` only if lat/lon changed.
2. Highlight: update highlight classes only if highlighted state changed.
3. Z-index: update only when highlight state changed.
4. If none of the above changed, do nothing to the marker.

## Highlight Semantics
1. Highlight count is derived from total visible top places:
   - If count >= 10: highlight top 3
   - Else: highlight top 30% (minimum 1)
2. Highlight changes should use class toggles and a short morph animation.
3. Highlight change should not recreate the marker icon instance.

## TTL Cache Semantics (Pan Continuity)
1. Markers are stored in memory cache with:
   - marker instance
   - highlighted state
   - last-seen timestamp
2. Markers missing from current payload are removed from active layer immediately.
3. Missing markers remain in memory cache until TTL expires.
4. If the same `place.id` reappears before TTL expiry, reuse cached marker.
5. After TTL expiry, remove marker from cache completely.

Current default:
- Marker cache TTL = 30 seconds

## Animation Policy
1. Enter animation:
   - Run only when marker is newly created.
2. Morph animation:
   - Run only when highlighted state toggles.
3. Selection jump/floating animation:
   - Trigger only for selected place marker.
4. Do not add heavy animation orchestration or cross-frame state machines.

## Transition Animation Architecture
The top-place transition system is intentionally split into three layers so visual changes stay smooth without rebuilding the whole overlay.

1. Request layer
   - `useRequestTopPlaces` debounces viewport churn and rejects stale responses.
   - Only the latest `responseKey === queryKey` payload is allowed to touch the map.

2. Marker cache layer
   - `syncTopPlaceMarkers()` owns the id-keyed marker cache.
   - Existing markers are reused when the same `place.id` reappears.
   - Marker removal is deferred with a short exit timeout so disappearing pins can animate out before being dropped from the layer.
   - If a pin reappears before its exit timeout completes, the pending removal is canceled and the marker is reused.

3. Visual state layer
   - `makeTopPlacePinIcon()` builds the mounted DOM structure with the enter class already present so first paint can animate reliably.
   - `setTopPlaceMarkerHighlighted()` mutates only highlight-related classes and uses a small morph animation.
   - `restartTopPlacePinEnter()` is reserved for the rare case where a cached marker was actually removed from the layer and re-added.

This design avoids coupling animation to the entire overlay lifecycle. Instead, each pin owns its own state transitions, which keeps the animation behavior stable under pan/zoom updates and cache reuse.

## Expected Outcomes
1. Pan across nearby areas should not cause repeated blink of the same pin.
2. Zoom changes should preserve shared pins where possible.
3. Markers should feel continuous, with minimal DOM churn.
4. Visual updates should be smooth but implementation should stay maintainable.

## Non-Goals
1. No persistence of marker cache across page reloads.
2. No backend contract changes for this behavior.
3. No strict animation choreography beyond simple enter/morph/selection effects.

## Verification Checklist
1. Pan within nearby viewport:
   - unchanged pins remain stable
   - no full-overlay flash
2. Zoom in/out where some IDs persist:
   - shared IDs are reused
   - highlight changes animate without full marker rebuild
3. Rapid pan/zoom:
   - stale responses are ignored
   - latest valid success response wins
4. Memory behavior:
   - disappeared markers are evicted after TTL
