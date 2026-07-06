# BubbleAvatar Drag Runtime Migration: dragPos -> MotionValues

> Created: 2026-07-06

## Why this document exists
This document explains the drag runtime refactor that removed per-frame React state updates (`dragPos`) and replaced them with Framer Motion `MotionValue`-based tracking.

## Problem before the change
The old drag path used React state updates on every pointer move.

Primary path:
- `useBubbleDrag.ts`
  - `const [dragPos, setDragPos] = useState<Point | null>(null)`
  - `handleDrag` called `setDragPos({ x, y })` for each Framer `onDrag` event.
  - `handleDragMoveToPoint` also called `setDragPos({ x, y })` for coarse-pointer raw drag.

Downstream consumers:
- `BubbleAvatarHome.tsx`
  - drop-ring position derived from `dragPos`
  - style branch selected `'raw-drag'` when `dragPos` existed
- `useHomeProximity.ts`
  - near-home detection recomputed via `useEffect` dependency on `dragPos`
- `useBubbleStyle.ts`
  - `'raw-drag'` branch generated fixed `left/top` from `dragPos`

### Observed cost model
Because `dragPos` lived in React state:
- each move frame scheduled a component render
- render and reconciliation ran while map and Framer animations could also be active
- drag/fly interactions were more susceptible to intermittent frame drops

## What changed
The drag runtime now uses Framer Motion values outside React render for high-frequency coordinates.

### New hook
- `useDragAndDrop/useDragMotionValues.ts`

Responsibilities:
- creates and owns motion values:
  - `dragMotion.pointer.x`
  - `dragMotion.pointer.y`
  - `dragMotion.rawOffset.x`
  - `dragMotion.rawOffset.y`
- owns raw-drag anchor ref
- exposes explicit APIs:
  - `beginAt(x, y)`
  - `updatePointer(x, y)`
  - `updateRawOffset(x, y)`
  - `reset()`

### useBubbleDrag after migration
- delegates all motion-value/ref management to `useDragMotionValues`
- keeps only drag lifecycle and drop semantics:
  - start/stop Leaflet map dragging
  - near-home check
  - map-bounds drop conversion
  - cancel routing

### useHomeProximity after migration
- no `dragPos` state dependency
- subscribes to motion-value changes via `useMotionValueEvent`
- triggers `onNearHomeChange` only on threshold transitions

### BubbleAvatarHome after migration
- drop-ring follows `dragMotion.pointer` directly using a positioned shell
- coarse-pointer raw drag applies `x/y` motion offsets using `dragMotion.rawOffset`
- no per-frame React state updates required for pointer location

### useBubbleStyle after migration
- removed `'raw-drag'` keyword branch
- style keywords now cover stable placement concerns only:
  - `'mobile-home'`
  - `'pickup'`
- raw drag displacement is handled by motion values rather than style keyword switching

## Before vs After summary

### Before
- high-frequency pointer position in React state (`dragPos`)
- style keyword `'raw-drag'` encoded moving pointer position
- near-home logic driven by effect dependency on React state

### After
- high-frequency pointer position in MotionValues
- style keyword no longer encodes live pointer movement
- near-home logic driven by motion-value subscriptions

## Why this is worth it
1. Better frame stability during drag
- Pointer updates bypass React render/reconciliation.

2. Better separation of concerns
- `useDragMotionValues` owns mutable motion data.
- `useBubbleDrag` owns drag/drop semantics.

3. Cleaner mental model
- style keywords represent discrete placement modes, not per-frame motion.

## Tradeoff and mitigation
Tradeoff:
- Slightly more moving pieces (motion values + helper hook).

Mitigation:
- complexity isolated in one hook (`useDragMotionValues`)
- call sites now consume grouped `dragMotion` object rather than many flat variables

## Files touched by the migration
- `useDragAndDrop/useDragMotionValues.ts` (new)
- `useDragAndDrop/useBubbleDrag.ts`
- `BubbleAvatarHome/BubbleAvatarHome.tsx`
- `BubbleAvatarHome/hooks/useHomeProximity.ts`
- `BubbleAvatarHome/hooks/useBubbleStyle.ts`
- `BubbleAvatarHome/BubbleAvatarHome.css`

## Behavior expectations
Unchanged functional behavior:
- near-home snap/cancel logic
- map drop conversion to lat/lng
- coarse-pointer raw drag path
- pickup pending drop-ring visual

Changed implementation behavior:
- pointer move no longer drives React re-render every frame
