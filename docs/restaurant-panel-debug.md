# Restaurant Panel Debug Logic

## Purpose
The restaurant panel debug overlay is a lightweight on-screen console for diagnosing mobile sheet behavior, viewport jitter, and snap transitions.

It is designed for real-device validation, especially iPhone Safari, where viewport and URL behavior can differ from desktop browsers.

## Main Files
- `src/Page1/components/MapCard/RestaurantInfoPanel/usePanelDebug.ts`
- `src/Page1/components/MapCard/RestaurantInfoPanel/useRestaurantPanelSnap.ts`
- `src/Page1/components/MapCard/RestaurantInfoPanel/RestaurantInfoPanel.tsx`
- `src/Page1/components/MapCard/RestaurantInfoPanel/RestaurantInfoPanel.css`
- `src/Page1/components/BubbleAvatar/BubbleAvatarHome/BubbleAvatarHome.tsx`
- `src/Page1/components/BubbleAvatar/useDragAndDrop/useBubbleDrag.ts`

## Architecture
### 1. `usePanelDebug`
Centralizes all debug-only behavior:
- Determines whether debug mode is enabled.
- Stores and exposes recent debug events.
- Provides `pushEvent(message)` for timestamped event logging.
- Handles URL/navigation listeners that can change debug state.

### 2. `useRestaurantPanelSnap`
Owns panel snap and resize logic, and uses `usePanelDebug` to emit debug events.

Examples of events pushed from snap logic:
- coarse pointer detection
- accepted/ignored resize deltas
- mobile/desktop mode transitions
- drag end snap index decisions

### 3. `RestaurantInfoPanel`
Renders the overlay via `createPortal(..., document.body)` when debug is enabled.

Using a portal avoids fixed-position issues caused by transformed ancestors and improves Safari reliability.

### 4. `BubbleAvatarHome` and `useBubbleDrag`
The final flicker fix lives outside the panel.

- Desktop/non-coarse pointer devices still use Framer Motion drag for the home bubble.
- Coarse-pointer devices use raw pointer tracking for bubble drag.
- Shared drop, cancel, and near-home logic still flows through `useBubbleDrag`.

## How Debug Mode Is Enabled
Debug mode is enabled when any of the following are true:

1. Query string
- `?panelDebug`
- `?panelDebug=1`
- truthy values: `true`, `yes`, `on`

2. Hash
- `#panelDebug`
- hash params containing `panelDebug`

3. Local storage
- `localStorage["panelDebug"]` is truthy

## Safari Notes
Safari and some share flows can deliver encoded query payloads such as:
- `?panelDebug%3D1%26v%3D20260614`

`usePanelDebug` decodes and re-parses this format so debug activation still works.

Once debug is detected, the hook persists `panelDebug=1` in local storage to keep the overlay available across subsequent navigations.

## Confirmed Root Cause
The mobile flicker was not caused by restaurant panel state, snap logic, or viewport measurements.

The confirmed root cause was Framer Motion drag on the home bubble avatar on coarse-pointer/iPhone-class devices.

Observed outcome:
- The restaurant panel appeared to flash between normal and fullscreen.
- Debug values for panel state remained stable during the flicker.
- Replacing coarse-pointer bubble drag with raw pointer tracking removed the flicker.

Practical interpretation:
- Safari was destabilized by the bubble's Framer drag/compositing path.
- The panel only exposed the issue visually because it is a large fixed moving layer.

## Bug Shape
The visible symptom was a false fullscreen flash in the restaurant panel while the user dragged the bubble avatar on iPhone Safari.

Important behavior notes:
- The panel appeared to jump between its intended snap size and a fullscreen-looking state.
- The debug overlay showed stable panel values during the flash.
- This meant the bug looked like panel state churn, but the render glitch was happening without corresponding panel state changes.

## What Was Tested But Did Not Fix It
The following probes did not resolve the issue on their own:

1. Locking panel snap points to fixed pixel values
2. Locking the final snap height to a fixed pixel value
3. Removing panel backdrop blur alone
4. Disabling panel drag momentum
5. Freezing panel transform while bubble drag was active
6. Reducing panel-derived geometry and resize sensitivity
7. Replacing percentage-based snap heights with fixed snap sizes
8. Temporarily converting the panel to a static non-dragging section
9. Reducing panel opacity/translucency and making the sheet visually flatter
10. Reducing bubble visual intensity alone (smaller drag scale/shadow) without changing drag mechanism

These tests were still useful because they ruled out panel state logic as the root cause.

## What We Learned From Failed Tests
The failed tests were still diagnostically valuable:

1. Stable debug values during the flash meant panel React state was not oscillating.
2. Fixed snap sizes did not stop the issue, so snap math was not the dominant trigger.
3. Freezing panel transform during bubble drag did not stop the issue, so panel transform updates were not the root cause.
4. Reducing panel blur/opacity could change presentation cost, but did not eliminate the bug.
5. The consistent common factor was bubble drag on coarse-pointer Safari.

## Final Fix
For coarse-pointer devices:

1. Bubble drag no longer uses Framer Motion drag.
2. Bubble drag uses raw `pointerdown` + window `pointermove` / `pointerup` / `pointercancel` tracking.
3. Drop resolution still runs through the shared drag/drop logic.
4. Desktop behavior remains unchanged.

This keeps the richer Framer path where it is stable and uses the safer path where Safari needs it.

## Non-Causal Changes Restored After Diagnosis
Once the root cause was confirmed, the panel-specific degradations that did not actually fix the bug were restored:

1. Percentage-based mobile snap heights
2. Translucent/frosted panel background styling
3. Mobile panel backdrop blur
4. Panel box shadow / visual depth

These were restored because they were not the source of the flicker.

## Temporary Debug/Isolation Changes Removed
The following temporary diagnostic changes were removed after confirming the root cause:

1. Lifting bubble drag state into `MapCard` solely to freeze the panel during bubble drag
2. `freezeDuringBubbleDrag` prop plumbing into `RestaurantInfoPanel`
3. `freezeTransform` option in `useRestaurantPanelSnap`

These were only used to disprove the panel-state hypothesis.

## Overlay Content
The debug overlay currently displays:
- mode (`mobile` or `desktop`)
- pointer type signal (`coarse` true/false)
- viewport width and height
- visualViewport height and window innerHeight
- current snap index and y offset
- recent timestamped debug events (bounded history)

## Styling Notes
Overlay styles are defined in `RestaurantInfoPanel.css` under `.restaurant-panel-debug-overlay`.

Key behavior:
- fixed positioning near top safe-area inset
- high z-index
- pointer-events disabled
- scrollable max height

## Operational Checklist
If debug is not visible on iPhone:
1. Open URL with `?panelDebug=1`.
2. If needed, use `#panelDebug` once.
3. Hard refresh Safari.
4. Confirm latest `gh-pages` deploy is live.

## Maintenance Guidance
- Keep debug parsing and persistence inside `usePanelDebug`.
- Keep panel behavior and event emission in `useRestaurantPanelSnap`.
- Add new event logs via `pushEvent` at decision points (resize acceptance, mode switch, snap decisions).
- Avoid adding debug-specific conditionals directly in rendering components unless strictly required.
- Treat coarse-pointer bubble drag as a platform fallback, not a temporary workaround.
- If mobile flicker reappears, inspect bubble drag implementation before revisiting panel snap logic.
- Prefer restoring removed UI polish only after the causal mechanism is proven; otherwise debugging can drift toward non-causal surfaces.
