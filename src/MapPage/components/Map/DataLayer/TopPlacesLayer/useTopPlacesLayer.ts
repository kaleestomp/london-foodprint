import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';

import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import useRequestTopPlaces, { type TopPlacesParams } from '../../../../request/useRequestTopPlaces/useRequestTopPlaces';
import { type TopPlaceItem } from '../../../../request/useRequestTopPlaces/request';
import { type NearbyPlace } from '../../../../request/useRequestNearby/request';
import useRequestNearby from '../../../../request/useRequestNearby/useRequestNearby';
import syncTopPlaceMarkers, { type TopPlaceMarkerCache } from './addTopPlacePins/addTopPlaceMarkers';
import useTopPlacesViewport from './useTopPlacesViewport';
import { type SearchMask } from '../LayerStates/filterTileOutsideMask';
import selectTopRankedPlaces from '../../../../utils/selectTopRankedPlaces';
import './addTopPlacePins/topPlacePin.css';

type UseTopPlacesLayerArgs = {
  mapRef: React.RefObject<L.Map | null>;
  enabled: boolean;
  selectedPlaceId: string | null;
  setSelectedPlaceId: (placeId: string | null) => void;
  onActiveTopPlaceIdsChange?: (ids: string[]) => void;
  throttleMs?: number;
};

const useTopPlacesLayer = ({
  mapRef,
  enabled,
  selectedPlaceId,
  setSelectedPlaceId,
  onActiveTopPlaceIdsChange,
  throttleMs = 80,
}: UseTopPlacesLayerArgs): void => {
  const {
    effectiveCuisines,
    effectivePriceRanges,
    venueType,
    scoreBasis,
    scoreTier,
    searchMask,
  } = useSearchFilters();

  const topPlacesLayerRef = useRef<L.LayerGroup | null>(null);
  const topPlaceCacheRef = useRef<TopPlaceMarkerCache>(new Map());
  const topPlaceMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const [viewportTopPlaces, setViewportTopPlaces] = useState<TopPlaceItem[]>([]);
  const [bubbleTopPlaces, setBubbleTopPlaces] = useState<Array<{ id: string; lat: number; lon: number; rank: number | null }>>([]);

  const viewportParams = useTopPlacesViewport(mapRef, enabled, throttleMs);

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

  const nearbyParams = useMemo(() => {
    if (!enabled || !searchMask) return null;

    return {
      lat: searchMask.center.lat,
      lng: searchMask.center.lng,
      radius_m: searchMask.radiusM,
      cuisines: effectiveCuisines,
      venue_type: venueType ?? '',
      cost: effectivePriceRanges,
      score_basis: scoreBasis,
      score_tier: scoreTier,
    };
  }, [
    enabled,
    searchMask,
    effectiveCuisines,
    venueType,
    effectivePriceRanges,
    scoreBasis,
    scoreTier,
  ]);

  const { res: nearbyRes } = useRequestNearby(nearbyParams);

  const {
    status: topPlacesStatus,
    res: topPlacesRes,
    queryKey: topPlacesQueryKey,
    responseKey: topPlacesResponseKey,
  } = useRequestTopPlaces(topPlacesParams, { debounceMs: 0 });

  // Keep viewport top places sticky through in-flight pan requests so markers
  // don't disappear when the viewport query key changes before success.
  useEffect(() => {
    if (!enabled) {
      setViewportTopPlaces([]);
      return;
    }
    if (topPlacesStatus !== 'success' || !topPlacesRes) return;
    if (topPlacesResponseKey !== topPlacesQueryKey) return;

    setViewportTopPlaces(topPlacesRes.data);
  }, [
    enabled,
    topPlacesStatus,
    topPlacesRes,
    topPlacesQueryKey,
    topPlacesResponseKey,
  ]);

  useEffect(() => {
    if (!enabled || !searchMask || !nearbyRes) {
      setBubbleTopPlaces([]);
      return;
    }
    setBubbleTopPlaces(selectTopRankedPlaces(nearbyRes.data, 10).map(mapNearbyToTopPlace));
  }, [
    enabled,
    searchMask,
    nearbyRes,
  ]);

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
    const maskedViewportTopPlaces = filterViewportTopPlacesOutsideMask(viewportTopPlaces, searchMask);

    const bubbleTopPlaceIds = new Set(bubbleTopPlaces.map((place) => place.id));

    const mergedTopPlaces = mergeTopPlacesById(maskedViewportTopPlaces, bubbleTopPlaces);
    onActiveTopPlaceIdsChange?.(mergedTopPlaces.map((place) => place.id));

    topPlaceMarkersRef.current = syncTopPlaceMarkers(
      layer,
      mergedTopPlaces,
      topPlaceCacheRef.current,
      (placeId) => setSelectedPlaceId(placeId),
      { bubbleTopPlaceIds },
    );
  }, [
    enabled,
    searchMask,
    viewportTopPlaces,
    bubbleTopPlaces,
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

const filterViewportTopPlacesOutsideMask = <T extends { lat: number; lon: number }>(
  places: T[],
  searchMask: SearchMask | null,
): T[] => {
  if (!searchMask) return places;

  const center = L.latLng(searchMask.center.lat, searchMask.center.lng);
  return places.filter((place) => L.latLng(place.lat, place.lon).distanceTo(center) > searchMask.radiusM);
};

const mapNearbyToTopPlace = (place: NearbyPlace) => ({
  id: place.id,
  lat: place.lat,
  lon: place.lon,
  rank: place.rank,
});

const mergeTopPlacesById = <T extends { id: string }>(left: T[], right: T[]): T[] => {
  const merged = new Map<string, T>();
  [...left, ...right].forEach((place) => {
    merged.set(place.id, place);
  });
  return [...merged.values()];
};

export default useTopPlacesLayer;
