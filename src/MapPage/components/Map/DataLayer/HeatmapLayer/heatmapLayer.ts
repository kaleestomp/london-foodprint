import type { HeatmapLayerSpecification } from 'maplibre-gl';
import { DEFAULT_GRADIENT } from './gradients';
import { DESKTOP_HEATMAP_LAYER, DESKTOP_HEATMAP_OPACITY,
    MOBILE_HEATMAP_LAYER, MOBILE_HEATMAP_OPACITY } from './heatmapLayerConfig';
// import { YlGnBu, YlOrBr, DEFAULT_GRADIENT, INFERNO, MAGMA, VIRIDIS, VIRIDIS_BRIGHT } from './gradients';

const heatmapLayer = (
  layerId: string,
  sourceId: string,
    isDesktop = false,
): HeatmapLayerSpecification => {
    const heatmapRadius = isDesktop ? DESKTOP_HEATMAP_LAYER : MOBILE_HEATMAP_LAYER;
    const heatmapOpacity = isDesktop ? DESKTOP_HEATMAP_OPACITY : MOBILE_HEATMAP_OPACITY;

    return {
    id: layerId,
    type: 'heatmap',
    source: sourceId,
    paint: {
        'heatmap-weight': ['get', 'weight'],
        'heatmap-intensity': [
            'interpolate', ['linear'], ['zoom'],
            0, 0.0,
            10, 0.2,
            14, 0.6,
            17, 1.0
        ],
        'heatmap-radius': heatmapRadius,
        'heatmap-opacity': heatmapOpacity,
        'heatmap-color': DEFAULT_GRADIENT,
    },
    };
};

export default heatmapLayer;