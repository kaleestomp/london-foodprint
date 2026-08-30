// TEMPORARY DEBUG LAYER: visualizes the bucketed viewport bbox used for top-places requests.
import { useEffect } from 'react';
import type maplibregl from 'maplibre-gl';

import { type ViewportBounds } from '../../../utils/getBucketedViewportBounds';

const SOURCE_ID = 'debug-viewport-rect-source';
const FILL_LAYER_ID = 'debug-viewport-rect-fill';
const LINE_LAYER_ID = 'debug-viewport-rect-line';

const toRectFeature = (bounds: ViewportBounds): GeoJSON.Feature<GeoJSON.Polygon> => ({
    type: 'Feature',
    properties: {},
    geometry: {
        type: 'Polygon',
        coordinates: [[
            [bounds.sw_lng, bounds.sw_lat],
            [bounds.ne_lng, bounds.sw_lat],
            [bounds.ne_lng, bounds.ne_lat],
            [bounds.sw_lng, bounds.ne_lat],
            [bounds.sw_lng, bounds.sw_lat],
        ]],
    },
});

const useDebugViewportRect = (
    mapRef: React.RefObject<maplibregl.Map | null>,
    bounds: ViewportBounds | null,
    enabled: boolean = true,
): void => {

    
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        let removed = false;

        const render = (): void => {
            if (removed) return;

            if (!enabled || !bounds) {
                if (map.getLayer(LINE_LAYER_ID)) map.removeLayer(LINE_LAYER_ID);
                if (map.getLayer(FILL_LAYER_ID)) map.removeLayer(FILL_LAYER_ID);
                if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
                return;
            }

            const data = toRectFeature(bounds);
            const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;

            if (source) {
                source.setData(data);
                return;
            }

            map.addSource(SOURCE_ID, { type: 'geojson', data });
            map.addLayer({
                id: FILL_LAYER_ID,
                type: 'fill',
                source: SOURCE_ID,
                paint: { 'fill-color': '#ff0055', 'fill-opacity': 0.08 },
            });
            map.addLayer({
                id: LINE_LAYER_ID,
                type: 'line',
                source: SOURCE_ID,
                paint: { 'line-color': '#ff0055', 'line-width': 2, 'line-dasharray': [2, 2] },
            });
            // Move layer to front
            map.moveLayer(FILL_LAYER_ID);
            map.moveLayer(LINE_LAYER_ID);
            console.log(bounds);
        };

        if (map.isStyleLoaded()) {
            render();
        } else {
            map.once('load', render);
        }

        return () => {
            removed = true;
            map.off('load', render);
            if (!map.getStyle()) return;
            if (map.getLayer(LINE_LAYER_ID)) map.removeLayer(LINE_LAYER_ID);
            if (map.getLayer(FILL_LAYER_ID)) map.removeLayer(FILL_LAYER_ID);
            if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
        };
    }, [mapRef, bounds, enabled]);
};

export default useDebugViewportRect;
