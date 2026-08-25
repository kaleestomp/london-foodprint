import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type maplibregl from 'maplibre-gl';

import { type LatLng } from '../config';
import useMapViewportNavigation from '../MapNavigation/useMapViewportNavigation';
import { useAppUI } from '../../../../context/AppUIContext';
import useBottomPadding from '../../MapViewportSync/useBottomPadding/useBottomPadding';

type UseMapPanToLocationArgs = {
  mapRef: React.RefObject<maplibregl.Map | null>;
};
type out = {
  targetLatLng: LatLng | null;
  flightToken: number | null;
}

/**
 * Pure map navigation concern: pans the map to a target location and calls
 * onReady when the map has settled. Handles token deduplication to avoid
 * duplicate pans from stale programmatic drop requests.
 */
const useMapPanToLocation = ({
  mapRef,
}: UseMapPanToLocationArgs): out => {
  const { focusMap } = useMapViewportNavigation({ mapRef });
  const { liveLocation } = useAppUI();
  const bottomPadding = useBottomPadding(mapRef);
  // Token for flight triggered by geo location updates
  const [flightToken, setFlightToken] = useState<number | null>(null);
  // Memoize targetLatLng to prevent unnecessary re-creation and infinite loops
  const targetLatLng = useMemo(
      () => liveLocation ? { lat: liveLocation.lat, lng: liveLocation.lng } : null,
      [liveLocation?.lat, liveLocation?.lng]
  );
  const onReady = useCallback(() => {
      setFlightToken(liveLocation?.token ?? null);
  }, [liveLocation?.token]);

  // useEffect to pan map to user location
  // Token deduplication: only pan if the token is new and not already handled
  const token = liveLocation?.token ?? null;
  const handledTokenRef = useRef<number | null>(null);
  useEffect(() => {
    if (!targetLatLng || !token || handledTokenRef.current === token) {
      return;
    }

    handledTokenRef.current = token;

    return focusMap({
      target: targetLatLng,
      method: 'pan',
      animate: true,
      onSettled: onReady,
      skipIfWithinMeters: 1,
      padding: {
        top: 0,
        right: 0,
        bottom: bottomPadding,
        left: 0,
      },
    });
  }, [targetLatLng, token, onReady, focusMap, bottomPadding]);

  return {targetLatLng, flightToken};
};

export default useMapPanToLocation;
