# Request Hook Guards

## Purpose
This note documents race-safety protections added to request hooks so rapid filter changes do not render stale results.

## What Was Added
1. Abort previous in-flight request whenever query dependencies change (`AbortController` in `useEffect` cleanup).
2. Track latest request sequence id (`latestRequestIdRef`) per hook.
3. Only allow the latest request to update `res` and loading state.
4. Keep `isActiveRef` checks so stale async callbacks cannot set state after cleanup.

## Files Updated
- `src/Page1/request/useRequestTiles/useRequestTiles.ts`
- `src/Page1/request/useRequestNearby/useRequestNearby.ts`

## Tiles-Specific Follow-up
`useRequestTiles` now exposes:
- `queryKey` (current request key)
- `responseKey` (key associated with current `res`)

This enables consumers (for example DataLayer) to ignore stale responses where `responseKey !== queryKey`.

## Why This Matters
Without these guards, very fast filter toggles can allow an older response to apply after a newer filter selection, causing one-step lag or inconsistent map updates.
