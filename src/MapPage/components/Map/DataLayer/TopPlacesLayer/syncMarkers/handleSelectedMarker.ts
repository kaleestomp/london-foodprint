import L from 'leaflet';

import { clearTopPlacePinTransitions, restartTopPlacePinEnter } from './markers/TopPlacePin';
import { cancelScheduledRemoval } from './markerLifecycle/scheduleRemoval';
import type { MarkerLifecycleCache } from './markerLifecycle/markerLifecycle';

type Props = {
    activeMarkers: Map<string, L.Marker>;
    selectedPlaceId: string | null;
    layer: L.LayerGroup;
    cache: MarkerLifecycleCache;
    now: number;
}

const handleSelectedMarker = ({ activeMarkers, selectedPlaceId, layer, cache, now }: Props) => {

  // Keep the selected marker visible even when it is temporarily outside
  // the latest merged payload; it should only exit once unselected.
  if (!selectedPlaceId) return;

  const selectedEntry = cache.get(selectedPlaceId);
  if (!selectedEntry || activeMarkers.has(selectedPlaceId)) return;

  cancelScheduledRemoval(selectedEntry);
  clearTopPlacePinTransitions(selectedEntry.marker);
  if (!layer.hasLayer(selectedEntry.marker)) {
    selectedEntry.marker.addTo(layer);
    restartTopPlacePinEnter(selectedEntry.marker);
  }
  selectedEntry.lastSeenAt = now;
  activeMarkers.set(selectedPlaceId, selectedEntry.marker);

};

export default handleSelectedMarker;
