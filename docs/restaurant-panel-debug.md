# Restaurant Panel Debug Logic

## Purpose
The restaurant panel debug overlay is a lightweight on-screen console for diagnosing mobile sheet behavior, viewport jitter, and snap transitions.

It is designed for real-device validation, especially iPhone Safari, where viewport and URL behavior can differ from desktop browsers.

## Main Files
- `src/Page1/components/MapCard/RestaurantInfoPanel/usePanelDebug.ts`
- `src/Page1/components/MapCard/RestaurantInfoPanel/useRestaurantPanelSnap.ts`
- `src/Page1/components/MapCard/RestaurantInfoPanel/RestaurantInfoPanel.tsx`
- `src/Page1/components/MapCard/RestaurantInfoPanel/RestaurantInfoPanel.css`

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
