import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';

import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import useRequestTopPlaces, { type TopPlacesParams } from '../../../../request/useRequestTopPlaces/useRequestTopPlaces';
import syncTopPlaceMarkers, { type TopPlaceMarkerCache } from './addTopPlacePins/addTopPlaceMarkers';
import useTopPlacesViewport from './useTopPlacesViewport';
import './addTopPlacePins/topPlacePin.css';

type UseTopPlacesLayerArgs = {
  mapRef: React.RefObject<L.Map | null>;
  enabled: boolean;
  selectedPlaceId: string | null;
  setSelectedPlaceId: (placeId: string | null) => void;
  onActiveTopPlaceIdsChange?: (ids: string[]) => void;
  debounceMs?: number;
};

const useTopPlacesLayer = ({
  mapRef,
  enabled,
  selectedPlaceId,
  setSelectedPlaceId,
  onActiveTopPlaceIdsChange,
  debounceMs = 80,
}: UseTopPlacesLayerArgs): void => {
  const {
    effectiveCuisines,
    effectivePriceRanges,
    venueType,
    scoreBasis,
    scoreTier,
  } = useSearchFilters();

  const topPlacesLayerRef = useRef<L.LayerGroup | null>(null);
  const topPlaceCacheRef = useRef<TopPlaceMarkerCache>(new Map());
  const topPlaceMarkersRef = useRef<Map<string, L.Marker>>(new Map());

  const viewportParams = useTopPlacesViewport(mapRef, enabled, debounceMs);

  const topPlacesParams = useMemo<TopPlacesParams | null>(() => {
    if (!enabled || !viewportParams) return null;

    return {
      sw_lat: viewportParams.sw_lat,
      sw_lng: viewportParams.sw_lng,
      ne_lat: viewportParams.ne_lat,
      ne_lng: viewportParams.ne_lng,
      res: viewportParams.res,
      cuisines: effectiveCuisines,
      cost: effectivePriceRanges,
      venue_type: venueType ?? undefined,
      score_basis: scoreBasis,
      score_tier: scoreTier,
      limit: 10,
    };
  }, [
    enabled,
    viewportParams,
    effectiveCuisines,
    effectivePriceRanges,
    venueType,
    scoreBasis,
    scoreTier,
  ]);

  const {
    status: topPlacesStatus,
    res: topPlacesRes,
    queryKey: topPlacesQueryKey,
    responseKey: topPlacesResponseKey,
  } = useRequestTopPlaces(topPlacesParams, { debounceMs: 0 });

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
  }, [enabled, mapRef]);

  useEffect(() => {
    const layer = topPlacesLayerRef.current;
    if (!enabled || !layer) return;
    if (topPlacesStatus !== 'success' || !topPlacesRes) return;
    if (topPlacesResponseKey !== topPlacesQueryKey) return;

    onActiveTopPlaceIdsChange?.(topPlacesRes.data.map((place) => place.id));

    topPlaceMarkersRef.current = syncTopPlaceMarkers(
      layer,
      topPlacesRes.data,
      topPlaceCacheRef.current,
      (placeId) => setSelectedPlaceId(placeId),
    );
  }, [
    enabled,
    topPlacesStatus,
    topPlacesRes,
    topPlacesQueryKey,
    topPlacesResponseKey,
    setSelectedPlaceId,
    onActiveTopPlaceIdsChange,
  ]);

  useEffect(() => {
    if (!enabled) {
      onActiveTopPlaceIdsChange?.([]);
    }
  }, [enabled, onActiveTopPlaceIdsChange]);

  useEffect(() => {
    topPlaceMarkersRef.current.forEach((marker, placeId) => {
      const motion = marker.getElement()?.querySelector<HTMLElement>('.top-place-pin-motion');
      const shell = marker.getElement()?.querySelector<HTMLElement>('.top-place-pin-shell');
      if (!motion) return;

      motion.classList.remove('is-selected');
      shell?.classList.remove('is-selected');
      if (!selectedPlaceId || placeId !== selectedPlaceId) {
        marker.closePopup();
        return;
      }

      // Selected top-place pins should only run idle floating animation.
      motion.classList.add('is-selected');
      shell?.classList.add('is-selected');
      marker.openPopup();
    });
  }, [selectedPlaceId, topPlacesResponseKey]);

  useEffect(() => {
    if (!enabled) return;
    const map = mapRef.current;
    if (!map) return;

    const handleMapClick = () => {
      if (selectedPlaceId) {
        setSelectedPlaceId(null);
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [enabled, mapRef, selectedPlaceId, setSelectedPlaceId]);
};

export default useTopPlacesLayer;
