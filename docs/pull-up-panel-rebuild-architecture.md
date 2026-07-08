# PullUpPanel Rebuild Architecture

## Overview
The rebuild introduces a simpler two-state mobile sheet and separates rendering concerns into focused components.

## Component Structure
- `PullUpPanel`
  - Owns mobile vs desktop layout branch.
  - Applies panel transform and transition.
  - Wires gesture handlers from snap state context.
  - Mounts `BottomToolbar`.
- `RestaurantList`
  - Owns list query and detail query usage.
  - Handles pagination UI.
  - Renders list rows and selected-place details.
  - Receives pointer handlers for scroll-top pull-down behavior.
- `BottomToolbar`
  - Is an empty fixed shell reserved for future map action buttons.
  - Receives panel metrics for future positioning logic.

## State Ownership
- `usePullUpPanelSnap`
  - Single source of truth for panel state and drag lifecycle.
  - Mobile states: `closed` and `open`.
  - Exposes:
    - `isPanelOpen`
    - `isMobile`
    - `translateY`
    - `panelHeight`
    - drag/pointer handlers
- `usePullUpPanelListQuery`
  - Owns list fetch params, page, reset behavior.
  - Uses bubble bounds when search mask exists.
  - Uses viewport bounds otherwise.
  - Fetch enabled by panel openness.

## Mobile Interaction Model
- Closed state:
  - Sheet translated so only 72px header remains visible.
  - Dragging panel or handle upward opens.
- Open state:
  - Sheet at translateY 0 with height = 50vh.
  - Content scroll enabled.
  - If scroll position is top and user drags down, panel transitions toward closed.

## Desktop Interaction Model
- Sidebar is fixed on the left using existing panel width variable.
- List is always scroll-enabled.
- `isPanelOpen` resolves true on desktop, so list queries are active.

## Bubble Integration
- `BubbleAvatar` is rendered at page level in `MapPage` (not inside `BottomToolbar`).
- `BubbleAvatarStateProvider` wraps only `BubbleAvatar`.
- `PullUpPanel` does not consume BubbleAvatar state.
- `BubbleAvatar` remains inside `PullUpPanelSnapProvider` because BubbleAvatar internals read snap metrics (`isMobile`, `panelHeight`, `translateY`).
- Bubble home-center calculations consume panel metrics to keep drop/home/ghost alignment coherent with panel movement.

## Why This Is Simpler
- Removes preview-state complexity.
- Removes tap-advance branching.
- Keeps drag logic in one place and list logic in another.
- Avoids cross-component coupling by passing only panel metrics into toolbar.

## Current Provider Tree
The current `MapPage` composition is:

```tsx
<TileQueryProvider>
  <PlaceSelectionProvider>
    <Map />
    <PullDownPanel />
    <PullUpPanelSnapProvider>
      <PullUpPanel />
      <BubbleAvatarStateProvider>
        <BubbleAvatar />
      </BubbleAvatarStateProvider>
    </PullUpPanelSnapProvider>
  </PlaceSelectionProvider>
</TileQueryProvider>
```

Notes:
- `PullUpPanel` depends on `PullUpPanelSnapProvider`.
- `BubbleAvatar` depends on both `PullUpPanelSnapProvider` and `BubbleAvatarStateProvider`.
- `PullUpPanel` does not require `BubbleAvatarStateProvider`.
