import { useEffect, useRef } from 'react';
import L from 'leaflet';

import useRequestTiles from '../../../../request/useRequestTiles/useRequestTiles';
import onUserRoam from './utils/onUserRoam';
import DelayLoadingScreen from './utils/delayLoadingScreen';
import createPersistentLayer from './utils/createPersistentLayer';
import usePinAnimations from './pinAnimations/usePinAnimations';
import { type SearchMask, filterDensityOutsideMask, filterPlacesOutsideMask } from './utils/filterTileOutsideMask';

const DataLayer = (mapRef: React.RefObject<L.Map | null>, searchMask: SearchMask | null = null): void => {
  const viewportParams = onUserRoam(mapRef);
  const { status, res } = useRequestTiles(viewportParams);

  DelayLoadingScreen(status);
  const layerRef = createPersistentLayer(mapRef);
  const { currentResRef, addPins, transitionRes, transitionToPlaces, transitionFromPlaces } = usePinAnimations(mapRef, layerRef);
  // Tracks the last rendered mode so we can detect places → tiles transitions.
  // So place markers can clear
  const prevModeRef = useRef<'tiles' | 'places' | null>(null);
  // Tracks mask transitions so we can force a full reconcile (remove stale in-radius pins).
  const prevMaskRef = useRef<SearchMask | null>(null);

  useEffect(() => {
    if (!mapRef.current || status !== 'success' || !res || !layerRef.current) return;

    const maskChanged = (() => {
      const prev = prevMaskRef.current;
      if (!prev && !searchMask) return false;
      if (!prev || !searchMask) return true;
      return (
        prev.radiusM !== searchMask.radiusM ||
        prev.center.lat !== searchMask.center.lat ||
        prev.center.lng !== searchMask.center.lng
      );
    })();

    prevMaskRef.current = searchMask;

    // Tile places mode: also mask out places inside the bubble radius to avoid
    // duplicate markers with BubbleAvatar's own nearby layer.
    if (res.mode === 'places') {
      prevModeRef.current = 'places';
      transitionToPlaces(filterPlacesOutsideMask(res.data, searchMask));
      return;
    }

    const filteredTiles = filterDensityOutsideMask(res.data, searchMask);

    // Coming back from places mode — animate place markers out, then show density pins.
    if (prevModeRef.current === 'places') {
      transitionFromPlaces(res.resolution, filteredTiles);
      prevModeRef.current = 'tiles';
      return;
    }
    prevModeRef.current = 'tiles';

    // Force full reconcile on mask changes so already-rendered in-radius density
    // markers are removed (not just preventing new ones).
    if (maskChanged) {
      transitionRes(res.resolution, filteredTiles);
      return;
    }

    if (res.resolution !== currentResRef.current) {
      transitionRes(res.resolution, filteredTiles);
    } else {
      addPins(filteredTiles, res.resolution);
    }
  }, [res, status, searchMask]);
};

export default DataLayer;
