import type maplibregl from 'maplibre-gl';

type MarkerRemovalTimer = ReturnType<typeof setTimeout>;
export type MarkerState = Record<string, never>;
export type MarkerLifecycleEntry = { marker: maplibregl.Marker; state: MarkerState; lastSeenAt: number; removalTimer: MarkerRemovalTimer | null };
export type MarkerLifecycleCache = Map<string, MarkerLifecycleEntry>;

type Props = {
  marker: maplibregl.Marker;
  cache: MarkerLifecycleCache;
  key: string;
  now: number;
};

export const refreshMarkerLifecycle = ({ marker, cache, key, now }: Props): MarkerLifecycleEntry => {
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