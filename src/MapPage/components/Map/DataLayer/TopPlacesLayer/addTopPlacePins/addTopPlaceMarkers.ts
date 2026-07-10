import L from 'leaflet';

import type { TopPlaceItem } from '../../../../../request/useRequestTopPlaces/request';
import makeTopPlacePinIcon, {
  animateTopPlacePinExit,
  clearTopPlacePinTransitions,
  restartTopPlacePinEnter,
  setTopPlaceMarkerHighlighted,
} from './makeTopPlacePinIcon';
import {
  cancelScheduledRemoval,
  markMarkerSeen,
  pruneInactiveExpiredEntries,
  scheduleExitRemoval,
  type TopPlacesLifecycleCache,
} from './topPlacesMarkerLifecycle';

const TOP_PLACE_PIN_CACHE_TTL_MS = 30 * 1000;
const TOP_PLACE_PIN_EXIT_MS = 360;

type TopPlaceMarkerState = {
  highlighted: boolean;
};

export type TopPlaceMarkerCache = TopPlacesLifecycleCache<TopPlaceMarkerState>;

const resolveHighlightCount = (count: number): number => {
  if (count <= 0) return 0;
  if (count >= 10) return Math.min(3, count);
  return Math.min(count, Math.max(1, Math.ceil(count * 0.3)));
};

const syncTopPlaceMarkers = (
  layer: L.LayerGroup,
  data: TopPlaceItem[],
  cache: TopPlaceMarkerCache,
  onPlaceClick?: (placeId: string) => void,
  options: {
    bubbleTopPlaceIds?: Set<string>;
  } = {},
): Map<string, L.Marker> => {
  if (!Array.isArray(data) || !layer) return new Map();

  const now = Date.now();
  const bubbleTopPlaceIds = options.bubbleTopPlaceIds;
  const highlightCount = resolveHighlightCount(data.length);
  const activeMarkers = new Map<string, L.Marker>();

  data.forEach((place, idx) => {
    const highlighted = idx < highlightCount;
    const cached = cache.get(place.id);
    const rankText = place.rank != null ? `Rank ${place.rank.toFixed(3)}` : 'Rank unknown';
    const popupHtml = `<strong>${place.id}</strong><br/>${rankText}`;
    const marker = cached?.marker ?? L.marker([place.lat, place.lon], {
      icon: makeTopPlacePinIcon({ highlighted }),
      zIndexOffset: highlighted ? 1600 : 1400,
    });

    if (marker.getPopup()) {
      marker.setPopupContent(popupHtml);
    } else {
      marker.bindPopup(popupHtml);
    }

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

    const shell = marker.getElement()?.querySelector<HTMLElement>('.top-place-pin-shell');
    if (shell) {
      shell.classList.toggle('top-place-pin-shell--bubble', !!bubbleTopPlaceIds?.has(place.id));
    }

    if (cached) {
      if (cached.state.highlighted !== highlighted) {
        setTopPlaceMarkerHighlighted(marker, highlighted, true);
        marker.setZIndexOffset(highlighted ? 1600 : 1400);
      }
    }

    markMarkerSeen({
      cache,
      key: place.id,
      marker,
      state: { highlighted },
      now,
    });

    activeMarkers.set(place.id, marker);
  });

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
