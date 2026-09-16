import { useEffect } from 'react';
import type * as maplibregl from 'maplibre-gl';

import { useGeoSearch } from '../../../GeoSearch/GeoSearchContext';
import { streetLineLayer } from './streetLayer';

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
};

export default useStreetLayer;
