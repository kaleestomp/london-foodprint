# PullUpPanel Rebuild Brief

## Goal
Rebuild PullUpPanel as a clean, maintainable module with explicit mobile and desktop behavior.

## UX Target
Use Google Maps iOS-style interaction as the reference for mobile panel feel:
- closed state exposes a compact header only
- open state reveals a scrollable list area
- dragging the header opens and closes the sheet
- when list is scrolled to top, pulling down closes the sheet

## Mobile Requirements
- Two states only:
  - `closed`: header visible at 72px
  - `open`: sheet height is 50% of viewport
- No intermediate preview state.
- Tap should not auto-advance state.
- List fetch should run only when panel is open on mobile.
- Bottom toolbar should visually track the panel top.

## Desktop Requirements
- Fixed left sidebar behavior remains.
- List remains visible and query-enabled.
- Bottom toolbar remains as an empty fixed shell for future map action buttons.

## Architecture Requirements
- Split render concerns into dedicated components:
  - `PullUpPanel` for container + layout
  - `RestaurantList` for query + list/detail content
  - `BottomToolbar` for future map action buttons (empty shell for now)
- Keep gesture logic in one dedicated hook.
- Preserve compatibility with existing filter/query contracts where possible.

## Integration Notes
- `BubbleAvatar` remains functionally unchanged and is mounted at page level in `MapPage`.
- `BubbleAvatarStateProvider` scopes to avatar only.
- Mobile bubble home positioning is computed from panel metrics to keep home/ghost aligned with the moving sheet.

## Out of Scope
- Visual redesign of map pins or bubble visual identity.
- Backend API schema changes.
