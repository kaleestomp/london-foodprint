import { useEffect, useRef } from 'react';
import L from 'leaflet';

import { type LatLng } from '../config';

type UseMapPanToLocationArgs = {
  mapRef: React.RefObject<L.Map | null>;
  targetLatLng: LatLng | null;
  token: number | null;
  onReady: () => void;
};

/**
 * Pure map navigation concern: pans the map to a target location and calls
 * onReady when the map has settled. Handles token deduplication to avoid
 * duplicate pans from stale programmatic drop requests.
 */
const useMapPanToLocation = ({
  mapRef,
  targetLatLng,
  token,
  onReady,
}: UseMapPanToLocationArgs) => {
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
};

export default useMapPanToLocation;
