import L from 'leaflet';

import type { TopPlaceItem } from '../../../../../request/useRequestTopPlaces/request';
import type { MarkerLifecycleCache } from './markerLifecycle/markerLifecycle';
import addMarkers from './addMarkers';
import handleSelectedMarker  from './handleSelectedMarker';
import removeMarkers from './removeMarkers';

type Props = {
  layer: L.LayerGroup;
  topPlaces: TopPlaceItem[];
  cache: MarkerLifecycleCache;
  onPlaceClick?: (placeId: string) => void;
  selectedPlaceId?: string | null;
}

const syncMarkers = ({ layer, topPlaces, cache, onPlaceClick, selectedPlaceId }: Props ): Map<string, L.Marker> => {

  if (!Array.isArray(topPlaces) || !layer) return new Map();
  const activeMarkers = new Map<string, L.Marker>();
  const now = Date.now();

  // ADD / UPDATE MARKERS
  addMarkers({ activeMarkers, layer, topPlaces, cache, onPlaceClick, now });

  // KEEP SELECTED MARKER VISIBLE
  handleSelectedMarker({activeMarkers, selectedPlaceId: selectedPlaceId ?? null, layer, cache, now});

  // SCHEDUDLE REMOVAL OF INACTIVE MARKERS + PRUNE EXPIRED CACHE
  removeMarkers({ activeMarkers, layer, cache, now });

  return activeMarkers;
};

export default syncMarkers;
