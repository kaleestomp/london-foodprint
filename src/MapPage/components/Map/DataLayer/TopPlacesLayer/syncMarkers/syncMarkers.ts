import type maplibregl from 'maplibre-gl';

import type { TopPlaceItem } from '../../../../../request/useRequestTopPlaces/request';
import type { MarkerLifecycleCache } from './markerLifecycle/markerLifecycle';
import addMarkers from './addMarkers';
import handleSelectedMarker  from './handleSelectedMarker';
import removeMarkers from './removeMarkers';

type Props = {
  map: maplibregl.Map;
  topPlaces: TopPlaceItem[];
  cache: MarkerLifecycleCache;
  onPlaceClick?: (placeId: string) => void;
  selectedPlaceId?: string | null;
}

const syncMarkers = ({ map, topPlaces, cache, onPlaceClick, selectedPlaceId }: Props ): Map<string, maplibregl.Marker> => {

  if (!Array.isArray(topPlaces) || !map) return new Map();
  // Used to track active marker registry 
  // Created, populated and returned for EACH SYNC PASS;
  // The state is temporary therefore REF not needed; 
  const activeMarkers = new Map<string, maplibregl.Marker>();
  const now = Date.now();

  // ADD / UPDATE MARKERS
  addMarkers({ activeMarkers, map, topPlaces, cache, onPlaceClick, now });

  // KEEP SELECTED MARKER VISIBLE
  handleSelectedMarker({activeMarkers, selectedPlaceId: selectedPlaceId ?? null, map, cache, now});

  // SCHEDUDLE REMOVAL OF INACTIVE MARKERS + PRUNE EXPIRED CACHE
  removeMarkers({ activeMarkers, cache, now });

  return activeMarkers;
};

export default syncMarkers;
