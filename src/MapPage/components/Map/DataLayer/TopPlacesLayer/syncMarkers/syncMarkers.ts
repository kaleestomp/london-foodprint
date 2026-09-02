import type maplibregl from 'maplibre-gl';

import type { SelectedLayer } from '../../../../../../context/PlaceSelectionContext';
import type { TopPlaceItem } from '../../../../../request/useRequestTopPlaces/request';
import type { MarkerLifecycleCache } from './markerLifecycle/markerLifecycle';
import handleNewTopPlaceMarkers from './handleNewTopPlaceMarkers';
import keepSelectedMarkerVisisble  from './keepSelectedMarkerVisisble';
import removeMarkers from './removeMarkers';

const syncMarkers = ({ map, topPlaces, cache, onClick, selectedPlaceId, selectedLayer }: {
  map: maplibregl.Map;
  topPlaces: TopPlaceItem[];
  cache: MarkerLifecycleCache;
  onClick: (placeId: string) => void;
  selectedPlaceId?: string | null;
  selectedLayer?: SelectedLayer | null;
} ): Map<string, maplibregl.Marker> => {

  if (!Array.isArray(topPlaces) || !map) return new Map();

  // Used to track active marker registry 
  // Created, populated and returned for EACH SYNC PASS;
  // The state is temporary therefore REF not needed; 
  const activeMarkers = new Map<string, maplibregl.Marker>();
  const now = Date.now();
  const suppressedPlaceId = selectedPlaceId && selectedLayer && selectedLayer !== 'topPlaces'
    ? selectedPlaceId
    : null;

  // ADD / UPDATE MARKERS
  handleNewTopPlaceMarkers({ activeMarkers, map, topPlaces, cache, onClick, suppressedId: suppressedPlaceId, now });

  // KEEP SELECTED MARKER VISIBLE
  // Keep the selected marker visible even when it is temporarily outside
  // the latest merged payload; it should only exit once unselected.
  
  if (selectedPlaceId && selectedLayer === 'topPlaces') {
    keepSelectedMarkerVisisble({ activeMarkers, selectedPlaceId: selectedPlaceId ?? null, map, cache, now });
  }

  // SCHEDUDLE REMOVAL OF INACTIVE MARKERS + PRUNE EXPIRED CACHE
  removeMarkers({ activeMarkers, cache, now });

  return activeMarkers;
};

export default syncMarkers;
