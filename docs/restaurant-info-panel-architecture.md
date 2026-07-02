# Restaurant Info Panel Architecture

## Scope
This document describes the current architecture of the Restaurant Info Panel in the `MapPage` flow, including state ownership, hook boundaries, render structure, and request lifecycles.

## Main Files
- `src/MapPage/components/RestaurantInfoPanel/RestaurantInfoPanel.tsx`
- `src/MapPage/components/RestaurantInfoPanel/useRestaurantPanelSnap.ts`
- `src/MapPage/components/RestaurantInfoPanel/RestaurantPanelSnapContext.tsx`
- `src/MapPage/components/RestaurantInfoPanel/usePanelListQuery.ts`
- `src/MapPage/components/RestaurantInfoPanel/config.ts`

## Component Responsibility
`RestaurantInfoPanel.tsx` is now primarily a render component.

It composes three concerns:
1. Panel pose and drag state from `useRestaurantPanelSnapState()`
2. Ranked list query state from `usePanelListQuery(isPanelOpen)`
3. Selected place detail query from `useRequestPlaceDetail(selectedPlaceId)`

The component does not own map bounds logic, filter-to-query translation, or snap math.

## State Ownership
### 1) Snap and Interaction State (local hook state)
Owned by `useRestaurantPanelSnap.ts`:
- `snapState`: `'closed' | 'preview' | 'full'`
- `translateY`: current mobile sheet transform offset
- `isDragging`: whether a drag gesture is active
- viewport and pointer-mode state (`isMobile`, coarse pointer signal)

Exports:
- `handlePanelPointerDown`: panel-body drag entry (mobile, non-full)
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

## Context Layer
`RestaurantPanelSnapContext.tsx` wraps the snap hook and exposes a stable consumer API:
- `RestaurantPanelSnapProvider`
- `useRestaurantPanelSnapState()`

This keeps gesture/snap internals out of render components and allows future replacement of snap logic without touching panel rendering.

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
  - Body area can start drag in non-full states

Scroll behavior:
- List scroll is enabled only in `full`
- Scroll is suppressed in `closed` and `preview` so vertical gestures prioritize sheet movement

## Data Request Flow
1. `usePanelListQuery` computes effective bounds from filters + map state
2. `useRequestPlacesList` fetches ranked page data while `isPanelOpen === true`
3. `RestaurantInfoPanel` renders loading, empty, or paged list rows
4. If `selectedPlaceId` exists, `useRequestPlaceDetail` fetches detail payload
5. Detail section renders status and links

## Internal Render Structure (RestaurantInfoPanel)
- Header/title area
- Ranked list area
- Pagination controls
- Selected pin detail area

A shared `ExternalLinks` subcomponent renders map/website links for both list rows and detail payload to avoid duplicate link markup.

## Config Constants
`config.ts` defines panel geometry and gesture thresholds:
- breakpoints and coarse pointer query
- mobile snap geometry (`MOBILE_PEEK_PX`, `MOBILE_PREVIEW_RATIO`, `MOBILE_FULL_TOP_GAP_PX`)
- resize jitter guards
- tap threshold (`TAP_THRESHOLD_PX`)

These constants are consumed by the snap hook only.

## Current Design Principles
- Keep rendering and behavior separate (component vs hook)
- Keep list query derivation isolated in one hook
- Keep cross-component selection state in context
- Minimize duplicate JSX for repeated UI fragments
- Keep mobile drag behavior encapsulated behind context API

## Known Follow-up Areas
- Fine-tune preview drag commit thresholds and direction heuristics
- Add explicit tests for mobile snap transitions and drag/tap classification
- Consider extracting list row rendering into its own presentational component if row interactions grow
