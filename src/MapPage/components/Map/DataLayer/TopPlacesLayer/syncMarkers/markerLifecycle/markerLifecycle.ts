import type maplibregl from 'maplibre-gl';

type MarkerRemovalTimer = ReturnType<typeof setTimeout>;
export type MarkerState = Record<string, never>;
export type MarkerLifecycleEntry = { marker: maplibregl.Marker; state: MarkerState; lastSeenAt: number; removalTimer: MarkerRemovalTimer | null };
export type MarkerLifecycleCache = Map<string, MarkerLifecycleEntry>;


export const refreshMarkerLifecycle = ({ cache, marker, key, now }: {
  cache: MarkerLifecycleCache;
  marker: maplibregl.Marker;
  key: string;
  now: number;
}): MarkerLifecycleEntry => {
  const existing = cache.get(key);
  if (existing) {
    existing.state = {};
    existing.lastSeenAt = now;
    return existing;
  }

  const newEntry: MarkerLifecycleEntry = {
    marker,
    state: {},
    lastSeenAt: now,
    removalTimer: null,
  };
  cache.set(key, newEntry);
  return newEntry;
};