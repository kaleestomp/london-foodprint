import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

import { type LatLng } from '../config';
import getVisibleMapTargetScreenPoint from '../getVisibleMapTargetScreenPoint';
import useMapViewportNavigation from '../onBubbleDrag/useMapViewportNavigation';
import { usePullUpPanelMetrics } from '../../PullUpPanel/SnapHooks/PullUpPanelSnapContext';
import useIsMobile from '../../../../utils/browser/useIsMobile';
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
  const { focusMap } = useMapViewportNavigation({ mapRef });
  const isMobile = useIsMobile();
  const { panelHeight, translateY } = usePullUpPanelMetrics();

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
    const targetScreenPoint = map
      ? getVisibleMapTargetScreenPoint(map, isMobile, panelHeight, translateY)
      : undefined;

    return focusMap({
      target: targetLatLng,
      method: 'pan',
      animate: true,
      onSettled: onReady,
      skipIfWithinMeters: 1,
      targetScreenPoint,
    });
  }, [targetLatLng, token, onReady, focusMap, isMobile, panelHeight, translateY, mapRef]);

  return {targetLatLng,programmaticFlightToken};
};

export default useMapPanToLocation;
