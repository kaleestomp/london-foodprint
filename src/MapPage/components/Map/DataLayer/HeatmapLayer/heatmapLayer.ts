import type { HeatmapLayerSpecification } from 'maplibre-gl';

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
            10, 12,
            14, 24,
            17, 32,
        ],
        'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            16, 0.45,
            16.5, 0,
        ],
        'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(33, 102, 172, 0)',
            0.2, '#2c7bb6',
            0.4, '#abd9e9',
            0.6, '#ffffbf',
            0.8, '#fdae61',
            1, '#d7191c',
        ],
    },
});

export default heatmapLayer;