import L from 'leaflet';

type MarkerRemovalTimer = ReturnType<typeof setTimeout>;

export type TopPlacesLifecycleEntry<TState> = {
  marker: L.Marker;
  state: TState;
  lastSeenAt: number;
  removalTimer: MarkerRemovalTimer | null;
};

export type TopPlacesLifecycleCache<TState> = Map<string, TopPlacesLifecycleEntry<TState>>;

type MarkSeenOptions<TState> = {
  cache: TopPlacesLifecycleCache<TState>;
  key: string;
  marker: L.Marker;
  state: TState;
  now: number;
};

type ScheduleExitOptions<TState> = {
  layer: L.LayerGroup;
  entry: TopPlacesLifecycleEntry<TState>;
  delayMs: number;
  onExit: (marker: L.Marker) => void;
};

type PruneOptions<TState> = {
  cache: TopPlacesLifecycleCache<TState>;
  activeKeys: Set<string>;
  now: number;
  ttlMs: number;
  onPrune: (entry: TopPlacesLifecycleEntry<TState>) => void;
};

export const cancelScheduledRemoval = <TState>(entry: TopPlacesLifecycleEntry<TState>): void => {
  if (entry.removalTimer) {
    clearTimeout(entry.removalTimer);
    entry.removalTimer = null;
  }
};

export const markMarkerSeen = <TState>({
  cache,
  key,
  marker,
  state,
  now,
}: MarkSeenOptions<TState>): TopPlacesLifecycleEntry<TState> => {
  const existing = cache.get(key);
  if (existing) {
    existing.state = state;
    existing.lastSeenAt = now;
    return existing;
  }

  const created: TopPlacesLifecycleEntry<TState> = {
    marker,
    state,
    lastSeenAt: now,
    removalTimer: null,
  };
  cache.set(key, created);
  return created;
};

export const scheduleExitRemoval = <TState>({
  layer,
  entry,
  delayMs,
  onExit,
}: ScheduleExitOptions<TState>): void => {
  if (entry.removalTimer) return;

  onExit(entry.marker);
  entry.removalTimer = setTimeout(() => {
    if (layer.hasLayer(entry.marker)) {
      layer.removeLayer(entry.marker);
    }
    entry.removalTimer = null;
  }, delayMs);
};

export const pruneInactiveExpiredEntries = <TState>({
  cache,
  activeKeys,
  now,
  ttlMs,
  onPrune,
}: PruneOptions<TState>): void => {
  for (const [key, entry] of cache) {
    if (activeKeys.has(key)) continue;
    if (now - entry.lastSeenAt <= ttlMs) continue;

    cancelScheduledRemoval(entry);
    onPrune(entry);
    cache.delete(key);
  }
};
