import type { HeatmapLayerSpecification } from 'maplibre-gl';
import { DEFAULT_GRADIENT } from './gradients';
// import { YlGnBu, YlOrBr, DEFAULT_GRADIENT, INFERNO, MAGMA, VIRIDIS, VIRIDIS_BRIGHT } from './gradients';

const heatmapLayer = (
  layerId: string,
  sourceId: string,
): HeatmapLayerSpecification => ({
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
        'heatmap-radius': [
            'interpolate', ['linear'], ['zoom'],
            0, 0,
            10, 12, //12
            14, 24, //24
            17, 32, //32
        ],
        'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            16, 0.45, 
            16.5, 0,
        ],
        'heatmap-color': DEFAULT_GRADIENT,
    },
});

export default heatmapLayer;