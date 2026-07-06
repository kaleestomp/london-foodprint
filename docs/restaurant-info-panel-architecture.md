# Restaurant Info Panel Architecture

## Scope
This document describes the current architecture of the Restaurant Info Panel in the `MapPage` flow, including state ownership, hook boundaries, render structure, and request lifecycles.

## Main Files
- `src/MapPage/components/RestaurantInfoPanel/RestaurantInfoPanel.tsx`
- `src/MapPage/components/RestaurantInfoPanel/RestaurantList.tsx`
- `src/MapPage/components/RestaurantInfoPanel/BottomToolbar.tsx`
- `src/MapPage/components/RestaurantInfoPanel/useRestaurantPanelSnap.ts`
- `src/MapPage/components/RestaurantInfoPanel/RestaurantPanelSnapContext.tsx`
- `src/MapPage/components/RestaurantInfoPanel/usePanelListQuery.ts`
- `src/MapPage/components/RestaurantInfoPanel/config.ts`

## Component Responsibility
`RestaurantInfoPanel.tsx` is primarily a layout and interaction wiring component.

It composes three concerns:
1. Panel pose and drag state from `useRestaurantPanelSnapState()`
2. List/detail content rendering through `RestaurantList`
3. Future toolbar slot rendering through `BottomToolbar`

`RestaurantList.tsx` owns list/detail query usage and pagination UI.

The panel component does not own map bounds logic, filter-to-query translation, or snap math.

## State Ownership
### 1) Snap and Interaction State (local hook state)
Owned by `useRestaurantPanelSnap.ts`:
- `snapState`: `'closed' | 'open'`
- `translateY`: current mobile sheet transform offset
- `isDragging`: whether a drag gesture is active
- viewport and pointer-mode state (`isMobile`, coarse pointer signal)

Exports:
- `handlePanelPointerDown`: panel-body drag entry (mobile, closed state)
- `handleHandlePointerDown`: handle drag entry (mobile)
- `isPanelOpen`: `true` on desktop, and mobile when state is not `closed`
- `panelHeight`, `translateY`, `isDragging`, `snapState`, `isMobile`

### 2) List Query State (isolated hook state)
Owned by `usePanelListQuery.ts`:
- `page` pagination state
- list request status/result from `useRequestPlacesList`

Derived query scope:
- If `searchMask` exists, list scope is bubble bounds (+ circle params)
- Otherwise list scope is last viewport tile bounds

Page reset triggers:
- geographic scope key change
- active filters key change

Fetch gating:
- list request is enabled only when panel is open (`isPanelOpen`)

### 3) Selection State (context)
Owned outside panel in `PlaceSelectionContext`:
- `selectedPlaceId`

The panel only consumes this state to fetch and render detail data.

### 4) Bubble State (separate context)
Owned outside panel in `BubbleAvatarStateContext`:
- bubble drop/pickup/drag state

`RestaurantInfoPanel` does not consume bubble state directly.

## Context Layer
`RestaurantPanelSnapContext.tsx` wraps the snap hook and exposes a stable consumer API:
- `RestaurantPanelSnapProvider`
- `useRestaurantPanelSnapState()`

This keeps gesture/snap internals out of render components and allows future replacement of snap logic without touching panel rendering.

`BubbleAvatarStateProvider` is intentionally scoped to `BubbleAvatar` and not used by `RestaurantInfoPanel`.

## Mobile vs Desktop Rendering
### Desktop
- Renders as left-side `aside`
- Always considered open
- No drag interaction path

### Mobile
- Renders as bottom sheet (`section`)
- Position driven by `translateY`
- Transition disabled while dragging
- Pointer handling split by area:
  - Header handle starts drag directly
  - Body area can start drag in closed state

Scroll behavior:
- List scroll is enabled only in `open`
- List scroll is suppressed in `closed` so vertical gestures prioritize sheet movement
- In `open`, pull-down from list-top is routed to sheet close gesture

## Data Request Flow
1. `usePanelListQuery` computes effective bounds from filters + map state
2. `useRequestPlacesList` fetches ranked page data while `isPanelOpen === true`
3. `RestaurantList` renders loading, empty, or paged list rows
4. If `selectedPlaceId` exists, `useRequestPlaceDetail` fetches detail payload
5. Detail section renders status and links

## Internal Render Structure
- `RestaurantInfoPanel`: mobile/desktop shell and drag-wiring
- `RestaurantList`: ranked list, pagination, selected pin detail
- `BottomToolbar`: empty fixed shell reserved for future map buttons

## Config Constants
`config.ts` defines panel geometry and gesture thresholds:
- breakpoints and coarse pointer query
- mobile snap geometry (`MOBILE_PEEK_PX`, open ratio in snap hook)
- resize jitter guards
- tap threshold (`TAP_THRESHOLD_PX`)

These constants are consumed by the snap hook only.

## Current Design Principles
- Keep rendering and behavior separate (component vs hook)
- Keep list query derivation isolated in one hook
- Keep cross-component selection state in context
- Keep BubbleAvatar lifecycle separate from panel content state
- Minimize duplicate JSX for repeated UI fragments
- Keep mobile drag behavior encapsulated behind context API

## Known Follow-up Areas
- Add explicit tests for mobile snap transitions and list-top pull-down close behavior
- Add toolbar button actions as separate presentational components when needed
