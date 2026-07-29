import L from 'leaflet';

import type { TopPlaceItem } from '../../../../../request/useRequestTopPlaces/request';
import makeTopPlacePinIcon, { animateTopPlacePinExit, clearTopPlacePinTransitions, restartTopPlacePinEnter } from './makeTopPlacePinIcon';
import { cancelScheduledRemoval, markMarkerSeen, pruneInactiveExpiredEntries, scheduleExitRemoval, type TopPlacesLifecycleCache } from './topPlacesMarkerLifecycle';

const TOP_PLACE_PIN_CACHE_TTL_MS = 30 * 1000;
const TOP_PLACE_PIN_EXIT_MS = 360;

type TopPlaceMarkerState = Record<string, never>;

export type TopPlaceMarkerCache = TopPlacesLifecycleCache<TopPlaceMarkerState>;

const syncTopPlaceMarkers = (
  layer: L.LayerGroup,
  data: TopPlaceItem[],
  cache: TopPlaceMarkerCache,
  onPlaceClick?: (placeId: string) => void,
  options: { selectedPlaceId?: string | null; } = {},
): Map<string, L.Marker> => {
  if (!Array.isArray(data) || !layer) return new Map();

  const now = Date.now();
  const selectedPlaceId = options.selectedPlaceId ?? null;
  const activeMarkers = new Map<string, L.Marker>();

  data.forEach((place) => {
    const cached = cache.get(place.id);
    const marker = cached?.marker ?? L.marker([place.lat, place.lon], {
      icon: makeTopPlacePinIcon( place?.cuisine_type ?? undefined ),
      zIndexOffset: 1400,
    });
    
    if (cached) {
      cancelScheduledRemoval(cached);
      // Marker can be reactivated while still on-layer with an exit class
      // applied from a previous frame; clear stale transitions so it stays visible.
      clearTopPlacePinTransitions(marker);
    }

    if (!cached && onPlaceClick) {
      marker.on('click', (event) => {
        L.DomEvent.stopPropagation(event);
        onPlaceClick(place.id);
      });
    }

    const wasOnLayer = layer.hasLayer(marker);
    if (!wasOnLayer) {
      marker.addTo(layer);
    }

    if (cached && !wasOnLayer) {
      clearTopPlacePinTransitions(marker);
      restartTopPlacePinEnter(marker);
    }

    const latLng = marker.getLatLng();
    if (latLng.lat !== place.lat || latLng.lng !== place.lon) {
      marker.setLatLng([place.lat, place.lon]);
    }

    markMarkerSeen({
      cache,
      key: place.id,
      marker,
      state: {},
      now,
    });

    activeMarkers.set(place.id, marker);
  });

  // Keep the selected marker visible even when it is temporarily outside
  // the latest merged payload; it should only exit once unselected.
  if (selectedPlaceId) {
    const selectedEntry = cache.get(selectedPlaceId);
    if (selectedEntry && !activeMarkers.has(selectedPlaceId)) {
      cancelScheduledRemoval(selectedEntry);
      clearTopPlacePinTransitions(selectedEntry.marker);
      if (!layer.hasLayer(selectedEntry.marker)) {
        selectedEntry.marker.addTo(layer);
        restartTopPlacePinEnter(selectedEntry.marker);
      }
      selectedEntry.lastSeenAt = now;
      activeMarkers.set(selectedPlaceId, selectedEntry.marker);
    }
  }

  for (const [placeId, entry] of cache) {
    const isActive = activeMarkers.has(placeId);
    if (!isActive && layer.hasLayer(entry.marker)) {
      scheduleExitRemoval({
        layer,
        entry,
        delayMs: TOP_PLACE_PIN_EXIT_MS,
        onExit: animateTopPlacePinExit,
      });
    }
  }

  pruneInactiveExpiredEntries({
    cache,
    activeKeys: new Set(activeMarkers.keys()),
    now,
    ttlMs: TOP_PLACE_PIN_CACHE_TTL_MS,
    onPrune: (entry) => {
      entry.marker.remove();
    },
  });

  return activeMarkers;
};

export default syncTopPlaceMarkers;
