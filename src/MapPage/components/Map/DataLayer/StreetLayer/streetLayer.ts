import type * as maplibregl from 'maplibre-gl';

const STREET_COLOR = '#d45b2a';

export const streetLineLayer = (
  layerId: string,
  sourceId: string,
): maplibregl.LineLayerSpecification => ({
  id: layerId,
  type: 'line',
  source: sourceId,
  layout: {
    'line-cap': 'round',
    'line-join': 'round',
  },
  paint: {
    'line-color': STREET_COLOR,
    'line-width': [
      'interpolate',
      ['linear'],
      ['zoom'],
      10, 3,
      14, 5,
      18, 8,
    ],
    'line-opacity': 0.9,
  },
});
