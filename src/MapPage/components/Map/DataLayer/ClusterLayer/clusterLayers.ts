import type { CircleLayerSpecification, ExpressionSpecification, SymbolLayerSpecification } from 'maplibre-gl';

export const clusterTextSize = (maxCount: number): ExpressionSpecification => {
  const highestCount = Math.max(Math.ceil(maxCount / 10) * 10, 10);
  return [
    'interpolate',
    ['linear'],
    ['get', 'point_count'],
    5, 10,
    highestCount, 18,
  ];
};

export const clusterCountLayer = (
  layerId: string,
  sourceId: string,
): SymbolLayerSpecification => ({
  id: layerId,
  type: 'symbol',
  source: sourceId,
  filter: ['has', 'point_count'],
  layout: {
    'text-field': ['get', 'point_count_abbreviated'],
    'text-font': ['Open Sans Bold'],
    'text-size': 10,
    'text-allow-overlap': true,
  },
  paint: {
    'text-color': '#ffffff',
    'text-halo-color': '#101010',
    'text-halo-width': 0.25,
    'text-opacity': 0.9,
  },
});


export const clusterCircleLayer = (
  layerId: string,
  sourceId: string,
): CircleLayerSpecification => ({
  id: layerId,
  type: 'circle',
  source: sourceId,
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': '#ffffff',
    'circle-opacity': 0,
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      16,
      25,
      22,
      100,
      28,
    ],
    'circle-stroke-color': '#ffffff',
    'circle-stroke-width': 0.5,
    'circle-stroke-opacity': 0.5,
  },
});

