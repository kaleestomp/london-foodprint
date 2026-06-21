import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';

import { type LatLng } from '../config';
import { useAppUI } from '../../../../context/AppUIContext';

type UseMapPanToLocationArgs = {
  mapRef: React.RefObject<L.Map | null>;
};
type out = {
  targetLatLng: LatLng | null;
  programmaticFlightToken: number | null;
}

/**
 * Pure map navigation concern: pans the map to a target location and calls
 * onReady when the map has settled. Handles token deduplication to avoid
 * duplicate pans from stale programmatic drop requests.
 */
const useMapPanToLocation = ({
  mapRef,
}: UseMapPanToLocationArgs): out => {

  // Handel Map Pan
  const { liveLocation } = useAppUI();
  // Token for flight triggered by geo location updates
  const [programmaticFlightToken, setProgrammaticFlightToken] = useState<number | null>(null);
  // Memoize targetLatLng to prevent unnecessary re-creation and infinite loops
  const targetLatLng = useMemo(
      () => liveLocation ? { lat: liveLocation.lat, lng: liveLocation.lng } : null,
      [liveLocation?.lat, liveLocation?.lng]
  );
  const onReady = useCallback(() => {
      setProgrammaticFlightToken(liveLocation?.token ?? null);
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

    const map = mapRef.current;
    if (!map) {
      onReady();
      return;
    }

    const latLng = L.latLng(targetLatLng.lat, targetLatLng.lng);
    let cancelled = false;

    // If already at target, proceed immediately
    if (map.getCenter().distanceTo(latLng) < 1) {
      onReady();
      return () => { cancelled = true; };
    }

    // Pan to target and call onReady when settled
    const onMoveEnd = () => {
      map.off('moveend', onMoveEnd);
      if (!cancelled) {
        onReady();
      }
    };

    map.on('moveend', onMoveEnd);
    map.panTo(latLng, { animate: true });

    return () => {
      cancelled = true;
      map.off('moveend', onMoveEnd);
    };
  }, [mapRef, targetLatLng, token, onReady]);

  return {targetLatLng,programmaticFlightToken};
};

export default useMapPanToLocation;
