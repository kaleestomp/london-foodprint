import type maplibregl from 'maplibre-gl';

import { clearTopPlacePinTransitions, restartTopPlacePinEnter } from './markers/TopPlacePin';
import { cancelScheduledRemoval } from './markerLifecycle/scheduleRemoval';
import type { MarkerLifecycleCache } from './markerLifecycle/markerLifecycle';

type Props = {
    activeMarkers: Map<string, maplibregl.Marker>;
    selectedPlaceId: string | null;
    map: maplibregl.Map;
    cache: MarkerLifecycleCache;
    now: number;
}

const handleSelectedMarker = ({ activeMarkers, selectedPlaceId, map, cache, now }: Props) => {

  // Keep the selected marker visible even when it is temporarily outside
  // the latest merged payload; it should only exit once unselected.
  if (!selectedPlaceId) return;

  const selectedEntry = cache.get(selectedPlaceId);
  if (!selectedEntry || activeMarkers.has(selectedPlaceId)) return;

  cancelScheduledRemoval(selectedEntry);
  clearTopPlacePinTransitions(selectedEntry.marker);
  if (!selectedEntry.marker.getElement().isConnected) {
    selectedEntry.marker.addTo(map);
    restartTopPlacePinEnter(selectedEntry.marker);
  }
  selectedEntry.lastSeenAt = now;
  activeMarkers.set(selectedPlaceId, selectedEntry.marker);

};

export default handleSelectedMarker;
