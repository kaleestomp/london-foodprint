import { useEffect } from 'react';
import type * as maplibregl from 'maplibre-gl';

import { useGeoSearch } from '../../../GeoSearch/GeoSearchContext';
import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import { boundaryLineLayer } from './boundaryLayer';
import PolygonMask from '../polygonMask/polygonMask';
import buildBoundaryMaskRings from '../polygonMask/buildBoundaryMaskRings';

const SOURCE_ID = 'geo-search-boundary-source';
// const FILL_LAYER_ID = 'geo-search-boundary-fill';
const LINE_LAYER_ID = 'geo-search-boundary-line';
const BOUNDARY_MASK_OPACITY = 0.48;

/**
 * Plots the boundary shape of the selected geo search result on the map.
 * Coordinate-based selections are handled separately via
 * queueLiveLocationDrop; this layer only renders Polygon/MultiPolygon.
 * Selection can trigger camera navigation, but the map navigation controller
 * owns the camera movement.
 * selections. Boundary-based place querying is intentionally left open.
 */
const useBoundaryLayer = (
  mapRef: React.RefObject<maplibregl.Map | null>,
): void => {

  const { selectedBoundary } = useGeoSearch();
  const { searchMask } = useSearchFilters();

  useEffect(() => {
    const map = mapRef.current;
    if (!map) { return; }

    const boundaryMaskRings = searchMask?.type === 'boundary' && searchMask.geometry
      ? buildBoundaryMaskRings(searchMask.geometry)
      : null;
    const boundaryMask = boundaryMaskRings
      ? PolygonMask(map, 0, 0, boundaryMaskRings)
      : null;
    boundaryMask?.setStyle({ fillOpacity: BOUNDARY_MASK_OPACITY });

    const removeLayer = () => {
      const currentMap = mapRef.current;
      if (!currentMap) { return; }
      try {
        // if (currentMap.getLayer(FILL_LAYER_ID)) { currentMap.removeLayer(FILL_LAYER_ID); }
        if (currentMap.getLayer(LINE_LAYER_ID)) { currentMap.removeLayer(LINE_LAYER_ID); }
        if (currentMap.getSource(SOURCE_ID)) { currentMap.removeSource(SOURCE_ID); }
      } catch {
        // Style already torn down (e.g. city switch) â€” nothing to remove
      }
    };

    if (!selectedBoundary) {
      removeLayer();
      return;
    }

    const feature = selectedBoundary.feature;
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

      // if (!map.getLayer(FILL_LAYER_ID)) {
      //   map.addLayer(boundaryFillLayer(FILL_LAYER_ID, SOURCE_ID));
      // }
      if (!map.getLayer(LINE_LAYER_ID)) {
        map.addLayer(boundaryLineLayer(LINE_LAYER_ID, SOURCE_ID));
      }
    };

    refreshLayer();
    map.on('styledata', refreshLayer);

    // CAMERA MOVEMENT NOT HANDLED BY DEDICATED NAVIGATION CONTROLLER
    // const bbox = featureBbox(feature);
    // if (bbox) {
    //   map.fitBounds(
    //     [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
    //     { padding: 80, duration: 900, maxZoom: 15 },
    //   );
    // }
    
    return () => {
      map.off('styledata', refreshLayer);
      removeLayer();
      boundaryMask?.remove();
    };
  }, [selectedBoundary, searchMask, mapRef]);
};

export default useBoundaryLayer;
