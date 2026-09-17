import { useEffect } from 'react';
import type * as maplibregl from 'maplibre-gl';

import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import { DROP_ENTRY_DELAY_MS, INIT_ZOOM_CLAMP_END } from '../../../BubbleAvatar/config';
import addSearchRadiusMarker from './addSearchRadiusMarker';


const RadiusLayer = (
  mapRef: React.RefObject<maplibregl.Map | null>,
): void => {
  const { searchMask } = useSearchFilters();

  useEffect(() => {
    const map = mapRef.current;
    const center = searchMask?.center;
    const radiusM = searchMask?.radiusM;
    if (!map || !center || !radiusM || searchMask?.type !== 'radius') return;

    const isAlreadyAtTargetZoom = map.getZoom() === INIT_ZOOM_CLAMP_END;
    const entryDelayMs = isAlreadyAtTargetZoom ? 0 : DROP_ENTRY_DELAY_MS;
    return addSearchRadiusMarker(
      map,
      center.lat,
      center.lng,
      radiusM,
      entryDelayMs,
    );
  }, [mapRef, searchMask]);
};

export default RadiusLayer;