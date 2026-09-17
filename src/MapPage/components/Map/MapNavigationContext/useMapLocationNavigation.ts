import { useCallback, useEffect, useMemo, useRef } from 'react';
import type * as maplibregl from 'maplibre-gl';

import { useAppUI } from '../../../../context/AppUIContext';
import { useMapLocationNavigationState } from './MapLocationNavigationContext';
import useMapViewportNavigation from './useMapViewportNavigation';
import { type LocationTarget } from '../../BubbleAvatar/config';
import { geometryBbox } from '../StyleLayer/BoundaryLayer/featureBbox';
import { useDrawerState } from '../../SlideUpDrawer/DrawerStateContext';

const useMapLocationNavigationController = (
  mapRef: React.RefObject<maplibregl.Map | null>,
): void => {
  const { liveLocation } = useAppUI();
  const { reportSettled } = useMapLocationNavigationState();
  const { focusMap } = useMapViewportNavigation( mapRef );
  const { snapPX } = useDrawerState();
  const handledTokenRef = useRef<number | null>(null);

  const targetLocation = useMemo<LocationTarget | null>(() => (
    liveLocation
      ? {
          lat: liveLocation.lat,
          lng: liveLocation.lng,
          searchType: liveLocation.searchType,
          geometry: liveLocation.geometry,
        }
      : null
  ), [liveLocation]);

  const report = useCallback(() => {
    if (targetLocation && liveLocation?.token) {
      reportSettled(targetLocation, liveLocation.token);
    }
  }, [liveLocation, reportSettled, targetLocation]);

  useEffect(() => {
    const map = mapRef.current;
    const token = liveLocation?.token;
    if (!map || !targetLocation || !token || handledTokenRef.current === token) return;

    handledTokenRef.current = token;
    const isGeometrySearch = targetLocation.searchType === 'boundary' || targetLocation.searchType === 'street';
    const bbox = targetLocation.geometry ? geometryBbox(targetLocation.geometry) : null;

    if (isGeometrySearch && bbox) {
      let cancelled = false;
      const onMoveEnd = () => {
        map.off('moveend', onMoveEnd);
        if (!cancelled) report();
      };
      map.on('moveend', onMoveEnd);
      map.fitBounds(
        [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
        { padding: { top: 0, right: 0, bottom: snapPX ?? 0, left: 0 }, duration: 900, maxZoom: targetLocation.searchType === 'boundary' ? 15 : 17 },
      );
      return () => {
        cancelled = true;
        map.off('moveend', onMoveEnd);
      };
    }

    return focusMap({
      target: targetLocation,
      method: 'pan',
      animate: true,
      onSettled: report,
      skipIfWithinMeters: 1,
      padding: { top: 0, right: 0, bottom: snapPX ?? 0, left: 0 },
    });
  }, [focusMap, liveLocation?.token, mapRef, report, snapPX, targetLocation]);
};

export default useMapLocationNavigationController;
