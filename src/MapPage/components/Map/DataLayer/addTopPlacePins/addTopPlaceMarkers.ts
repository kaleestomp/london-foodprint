import L from 'leaflet';

import type { TopPlaceItem } from '../../../../request/useRequestTopPlaces/request';
import makeTopPlacePinIcon, {
  animateTopPlacePinExit,
  clearTopPlacePinTransitions,
  restartTopPlacePinEnter,
  setTopPlaceMarkerHighlighted,
} from './makeTopPlacePinIcon';

const TOP_PLACE_PIN_CACHE_TTL_MS = 30 * 1000;
const TOP_PLACE_PIN_EXIT_MS = 360;

type TopPlaceCacheEntry = {
  marker: L.Marker;
  highlighted: boolean;
  lastSeenAt: number;
  removalTimer?: ReturnType<typeof setTimeout> | null;
};

export type TopPlaceMarkerCache = Map<string, TopPlaceCacheEntry>;

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
): Map<string, L.Marker> => {
  if (!Array.isArray(data) || !layer) return new Map();

  const now = Date.now();
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

    if (cached?.removalTimer) {
      clearTimeout(cached.removalTimer);
      cached.removalTimer = null;
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

    if (cached) {
      if (cached.highlighted !== highlighted) {
        setTopPlaceMarkerHighlighted(marker, highlighted, true);
        marker.setZIndexOffset(highlighted ? 1600 : 1400);
      }
      cached.highlighted = highlighted;
      cached.lastSeenAt = now;
    } else {
      cache.set(place.id, {
        marker,
        highlighted,
        lastSeenAt: now,
      });
    }

    activeMarkers.set(place.id, marker);
  });

  for (const [placeId, entry] of cache) {
    const isActive = activeMarkers.has(placeId);
    if (!isActive && layer.hasLayer(entry.marker) && !entry.removalTimer) {
      animateTopPlacePinExit(entry.marker);
      entry.removalTimer = setTimeout(() => {
        if (layer.hasLayer(entry.marker)) {
          layer.removeLayer(entry.marker);
        }
        entry.removalTimer = null;
      }, TOP_PLACE_PIN_EXIT_MS);
    }

    if (!isActive && now - entry.lastSeenAt > TOP_PLACE_PIN_CACHE_TTL_MS) {
      if (entry.removalTimer) {
        clearTimeout(entry.removalTimer);
      }
      entry.marker.remove();
      cache.delete(placeId);
    }
  }

  return activeMarkers;
};

export default syncTopPlaceMarkers;
