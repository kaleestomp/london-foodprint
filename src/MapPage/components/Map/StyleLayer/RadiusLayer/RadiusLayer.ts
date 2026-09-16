import { useEffect } from 'react';
import type * as maplibregl from 'maplibre-gl';

import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import { DROP_ENTRY_DELAY_MS, INIT_ZOOM_CLAMP_END } from '../../../BubbleAvatar/config';
import addSearchRadiusMarker from './addSearchRadiusMarker';
import PolygonMask from '../polygonMask/polygonMask';
import buildStreetMaskRings from '../polygonMask/buildStreetMaskRings';
import { WORLD_RING } from '../polygonMask/geometry';


const RadiusLayer = (
  mapRef: React.RefObject<maplibregl.Map | null>,
): void => {
  const { searchMask } = useSearchFilters();

  useEffect(() => {
    const map = mapRef.current;
    const center = searchMask?.center;
    const radiusM = searchMask?.radiusM;
    if (!map || !center || !radiusM || searchMask?.type === 'boundary') return;

    if (searchMask.type === 'street' && searchMask.geometry) {
      const streetRings = buildStreetMaskRings(searchMask.geometry, radiusM);
      if (!streetRings) return;
      const streetMasks = streetRings.slice(1).map((corridor) => {
        const mask = PolygonMask(map, center.lat, center.lng, [WORLD_RING, corridor]);
        mask.setStyle({ fillOpacity: 0.48 });
        return mask;
      });
      return () => streetMasks.forEach((mask) => mask.remove());
    }

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