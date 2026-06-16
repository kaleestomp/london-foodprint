import { useCallback, useState, type RefObject } from 'react';
import L from 'leaflet';

import { type LatLng, type Point } from '../config';

type UseFlightAnimationToPointArgs = {
  mapRef: RefObject<L.Map | null>;
  targetLatLng: LatLng | null;
  onAnimationComplete: (lat: number, lng: number) => void;
  onStateReset: () => void;
};

/**
 * Pure animation concern: sets up flyOutTo screen point for the bubble
 * to animate toward, and triggers completion callback when animation finishes.
 * Coordinates with the caller to initiate the flight after map navigation completes.
 */
const useFlightAnimationToPoint = ({
  mapRef,
  targetLatLng,
  onAnimationComplete,
  onStateReset,
}: UseFlightAnimationToPointArgs) => {
  const [flyOutTo, setFlyOutTo] = useState<Point | null>(null);
  const [pendingTargetLatLng, setPendingTargetLatLng] = useState<LatLng | null>(null);

  const startFlight = useCallback(() => {
    if (!targetLatLng || !mapRef.current) return;

    const map = mapRef.current;
    const rect = map.getContainer().getBoundingClientRect();
    const latLng = L.latLng(targetLatLng.lat, targetLatLng.lng);
    const point = map.latLngToContainerPoint(latLng);

    onStateReset();
    setPendingTargetLatLng({ lat: latLng.lat, lng: latLng.lng });
    setFlyOutTo({
      x: rect.left + point.x,
      y: rect.top + point.y,
    });
  }, [mapRef, targetLatLng, onStateReset]);

  const handleAnimationComplete = useCallback(() => {
    if (!pendingTargetLatLng) return;
    onAnimationComplete(pendingTargetLatLng.lat, pendingTargetLatLng.lng);
  }, [pendingTargetLatLng, onAnimationComplete]);

  const clear = useCallback(() => {
    setFlyOutTo(null);
    setPendingTargetLatLng(null);
  }, []);

  return {
    flyOutTo,
    startFlight,
    handleAnimationComplete,
    clear,
  };
};

export default useFlightAnimationToPoint;
