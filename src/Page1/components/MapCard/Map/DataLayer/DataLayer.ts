import { useEffect, useRef } from 'react';
import L from 'leaflet';

import useRequestTiles from '../../../../request/useRequestTiles/useRequestTiles';
import onUserRoam from './utils/onUserRoam';
import DelayLoadingScreen from './utils/delayLoadingScreen';
import createPersistentLayer from './utils/createPersistentLayer';
import usePinAnimations from './pinAnimations/usePinAnimations';

const DataLayer = (mapRef: React.RefObject<L.Map | null>): void => {
  const viewportParams = onUserRoam(mapRef);
  const { status, res } = useRequestTiles(viewportParams);

  DelayLoadingScreen(status);
  const layerRef = createPersistentLayer(mapRef);
  const { currentResRef, addPins, transitionRes, transitionToPlaces, transitionFromPlaces } = usePinAnimations(mapRef, layerRef);
  // Tracks the last rendered mode so we can detect places → tiles transitions.
  // So place markers can clear
  const prevModeRef = useRef<'tiles' | 'places' | null>(null);

  useEffect(() => {
    if (!mapRef.current || status !== 'success' || !res || !layerRef.current) return;

    if (res.mode === 'tiles') {
      // Coming back from places mode — animate place markers out, then show density pins.
      if (prevModeRef.current === 'places') {
        transitionFromPlaces(res.resolution, res.data);
        prevModeRef.current = 'tiles';
        return;
      }
      prevModeRef.current = 'tiles';

      if (res.resolution !== currentResRef.current) {
        transitionRes(res.resolution, res.data);
      } else {
        addPins(res.data, res.resolution);
      }
    } else {
      prevModeRef.current = 'places';
      transitionToPlaces(res.data);
    }
  }, [res, status]);
};

export default DataLayer;
