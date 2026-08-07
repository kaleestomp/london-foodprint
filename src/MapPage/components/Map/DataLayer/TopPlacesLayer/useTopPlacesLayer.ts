import { useEffect, useRef } from 'react';
import L from 'leaflet';

import { usePlaceSelection } from '../../../../../context/PlaceSelectionContext';
import useFetchTopPlaces from './InputHooks/useFetchTopPlaces';
import syncMarkers from './syncMarkers/syncMarkers';
import useReportTopPlacesIDs from './reportHooks/useReportTopPlacesIDs';
import type { MarkerLifecycleCache } from './syncMarkers/markerLifecycle/markerLifecycle';

import './syncMarkers/markers/TopPlacePin.css';

const useTopPlacesLayer = (
  mapRef: React.RefObject<L.Map | null>,
  setActiveTopPlaceIds: (ids: Set<string> | undefined) => void,
  enabled?: boolean,
): void => {

  const topPlaces = useFetchTopPlaces({ mapRef, enabled });
  useReportTopPlacesIDs( topPlaces, setActiveTopPlaceIds, enabled );

  const { selectedPlaceId, setSelectedPlaceId } = usePlaceSelection();
  const topPlacesLayerRef = useRef<L.LayerGroup | null>(null);
  const topPlaceCacheRef = useRef<MarkerLifecycleCache>(new Map());
  const topPlaceMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  
  // Layer Created on Map Mount
  useEffect(() => {
    if (!enabled) return;
    const map = mapRef.current;
    if (!map) return;

    const layer = L.layerGroup().addTo(map);
    topPlacesLayerRef.current = layer;

    return () => {
      topPlaceCacheRef.current.forEach((entry) => {
        entry.marker.remove();
      });
      topPlaceCacheRef.current.clear();
      topPlaceMarkersRef.current.clear();
      topPlacesLayerRef.current = null;
      layer.remove();
    };
  }, [mapRef, enabled]);

  // Sync Markers with TopPlaces Data
  useEffect(() => {
    const layer = topPlacesLayerRef.current;
    if (!enabled || !layer) return;

    topPlaceMarkersRef.current = syncMarkers({
      layer,
      topPlaces,
      cache: topPlaceCacheRef.current,
      onPlaceClick: (placeId) => setSelectedPlaceId(placeId),
      selectedPlaceId,
    });
  }, [ topPlaces, selectedPlaceId, setSelectedPlaceId, enabled ]);

  // Update Selected Pin CSS State
  useEffect(() => {
    topPlaceMarkersRef.current.forEach((marker, placeId) => {
      const motion = marker.getElement()?.querySelector<HTMLElement>('.top-place-pin-motion');
      const shell = marker.getElement()?.querySelector<HTMLElement>('.top-place-pin-shell');
      if (!motion) return;

      motion.classList.remove('is-selected');
      shell?.classList.remove('is-selected');
      if (!selectedPlaceId || placeId !== selectedPlaceId) {
        return;
      }

      // Selected top-place pins lift, scale up, and use selected floating motion.
      motion.classList.add('is-selected');
      shell?.classList.add('is-selected');
    });
  }, [selectedPlaceId, topPlaces]);

  // Deselect Top Place on Map Click
  useEffect(() => {
    if (!enabled) return;
    const map = mapRef.current;
    if (!map) return;

    const handleMapClick = () => {
      setSelectedPlaceId(null);
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [mapRef, setSelectedPlaceId, enabled]);
};

export default useTopPlacesLayer;
