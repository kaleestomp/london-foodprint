import { useEffect } from 'react';
import type * as maplibregl from 'maplibre-gl';

import { useGeoSearch } from '../../../GeoSearch/GeoSearchContext';
import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import { STREET_SEARCH_RADIUS } from '../../../BubbleAvatar/config';
import { streetLineLayer } from './streetLayer';
import PolygonMask from '../polygonMask/polygonMask';
import buildStreetMaskRings from '../polygonMask/buildStreetMaskRings';
import { WORLD_RING } from '../polygonMask/geometry';

const SOURCE_ID = 'geo-search-street-source';
const LAYER_ID = 'geo-search-street-line';

/** Renders the full LineString/MultiLineString geometry of a selected street.
 * Selection can trigger camera navigation, but the map navigation controller
 * owns the camera movement.
 */
const useStreetLayer = (
  mapRef: React.RefObject<maplibregl.Map | null>,
): void => {
  const { selectedStreet } = useGeoSearch();
  const { searchMask } = useSearchFilters();

  useEffect(() => {
    const map = mapRef.current;
    if (!map) { return; }

    const removeLayer = () => {
      const currentMap = mapRef.current;
      if (!currentMap) { return; }
      try {
        if (currentMap.getLayer(LAYER_ID)) { currentMap.removeLayer(LAYER_ID); }
        if (currentMap.getSource(SOURCE_ID)) { currentMap.removeSource(SOURCE_ID); }
      } catch {
        // Style already torn down (e.g. city switch) â€” nothing to remove
      }
    };

    if (!selectedStreet) {
      removeLayer();
      return;
    }

    const feature = selectedStreet.feature;
    const data: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [feature as GeoJSON.Feature],
    };

    const refreshLayer = () => {
      if (!map.isStyleLoaded()) { return; }

      const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      if (source) {
        source.setData(data);
      } else {
        map.addSource(SOURCE_ID, { type: 'geojson', data });
      }

      if (!map.getLayer(LAYER_ID)) {
        map.addLayer(streetLineLayer(LAYER_ID, SOURCE_ID));
      }
    };

    refreshLayer();
    map.on('styledata', refreshLayer);

    return () => {
      map.off('styledata', refreshLayer);
      removeLayer();
    };
  }, [selectedStreet, mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    const geometry = searchMask?.type === 'street'
      ? searchMask.geometry
      : selectedStreet?.feature.geometry;
    const center = searchMask?.center ?? (
      selectedStreet?.feature.center
        ? { lat: selectedStreet.feature.center[1], lng: selectedStreet.feature.center[0] }
        : null
    );
    const radiusM = searchMask?.radiusM ?? STREET_SEARCH_RADIUS;

    if (!map || !geometry || !center || !selectedStreet) return;

    const streetRings = buildStreetMaskRings(geometry, radiusM);
    if (!streetRings) return;

    const streetMasks = streetRings.slice(1).map((corridor) => {
      const mask = PolygonMask(map, center.lat, center.lng, [WORLD_RING, corridor]);
      mask.setStyle({ fillOpacity: 0.48 });
      return mask;
    });

    return () => streetMasks.forEach((mask) => mask.remove());
  }, [mapRef, searchMask, selectedStreet]);
};

export default useStreetLayer;
