import type maplibregl from 'maplibre-gl';

import { clearTopPlacePinTransitions, restartTopPlacePinEnter } from './markers/TopPlacePin';
import { cancelScheduledRemoval } from './markerLifecycle/scheduleRemoval';
import type { MarkerLifecycleCache } from './markerLifecycle/markerLifecycle';

type Props = {
  activeMarkers: Map<string, maplibregl.Marker>;
  selectedPlaceId: string;
  map: maplibregl.Map;
  cache: MarkerLifecycleCache;
  now: number;
}

const keepSelectedMarkerVisisble = ({ activeMarkers, selectedPlaceId, map, cache, now }: Props) => {

  // KEEP SELECTED MARKERS VISIBLE even when it is temporarily outside
  // the latest merged payload; it should only exit once unselected.
  const selectedEntry = cache.get(selectedPlaceId);
  if (selectedEntry && !activeMarkers.has(selectedPlaceId)) {
    // ONLY APPLIES TO PREVILOUSLY LOADED TOP PLACE MARKERS 
    // THAT ARE NO LONGER CURRENTLY ACTIVE
    cancelScheduledRemoval(selectedEntry);
    clearTopPlacePinTransitions(selectedEntry.marker);
    if (!selectedEntry.marker.getElement().isConnected) {
      selectedEntry.marker.addTo(map);
      restartTopPlacePinEnter(selectedEntry.marker);
    }
    selectedEntry.lastSeenAt = now;
    activeMarkers.set(selectedPlaceId, selectedEntry.marker);
  };

};

export default keepSelectedMarkerVisisble;
