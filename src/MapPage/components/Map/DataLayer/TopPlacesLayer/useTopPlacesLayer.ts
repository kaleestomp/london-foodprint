import type maplibregl from 'maplibre-gl';

import useFetchTopPlaces from './InputHooks/useFetchTopPlaces';
import useReportTopPlacesIDs from './reportHooks/useReportTopPlacesIDs';
import useUpdateSelectedMarkerStyle from './useUpdateSelectedMarkerStyle';
import useClearSelectionOnMapClick from './useClearSelectionOnMapClick';
import useSyncMarkers from './syncMarkers/useSyncMarkers';

import './syncMarkers/markers/TopPlacePin.css';

const useTopPlacesLayer = (
  mapRef: React.RefObject<maplibregl.Map | null>,
  enabled?: boolean,
): void => {

  const topPlaces = useFetchTopPlaces({ enabled });
  useReportTopPlacesIDs( topPlaces, enabled );

  // Sync Markers with TopPlaces Data
  const markersRef = useSyncMarkers(mapRef, topPlaces, enabled);

  // Update Selected Pin CSS State
  useUpdateSelectedMarkerStyle(markersRef, topPlaces);

  useClearSelectionOnMapClick(mapRef, enabled);
};

export default useTopPlacesLayer;
