import type { CircleLayerSpecification, ExpressionSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import { getCuisineColorExpression } from '../TopPlacesLayer/syncMarkers/markers/backdropColors/getCuisineColor';

const singletonOpacity: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['zoom'],
  16, 0,
  17, 1,
];

export const clusterCountLayer = (
  layerId: string,
  sourceId: string,
  darkMode: boolean = true,
): SymbolLayerSpecification => ({
  id: layerId,
  type: 'symbol',
  source: sourceId,
  filter: ['has', 'point_count'],
  layout: {
    'text-field': ['get', 'point_count_abbreviated'],
    // 'text-font': ['Open Sans SemiBold'],
    'text-size': 10,
    'text-allow-overlap': true,
  },
  paint: {
    'text-color': darkMode ? '#ffffff' : '#101010',
    'text-halo-color': darkMode ? '#101010' : '#ffffff',
    'text-halo-width': darkMode ? 0.5 : 1,
    'text-opacity': 0.9,
  },
});

export const unclusteredPointLayer = (
  layerId: string,
  sourceId: string,
): CircleLayerSpecification => ({
  id: layerId,
  type: 'circle',
  source: sourceId,
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': getCuisineColorExpression(['get', 'cuisine_type']),
    'circle-radius': 3.8,
    'circle-stroke-width': 0.45,
    'circle-stroke-color': '#101010',
    'circle-opacity': singletonOpacity,
  }
})

export const unclusteredPointShadowLayer = (
  layerId: string,
  sourceId: string,
): CircleLayerSpecification => ({
  id: layerId,
  type: 'circle',
  source: sourceId,
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': 'rgba(0, 0, 0, 0.42)',
    'circle-radius': 4.6,
    'circle-blur': 0.45,
    'circle-translate': [1.4, 1.8],
    'circle-opacity': singletonOpacity,
  },
})

export const unclusteredPointHighlightLayer = (
  layerId: string,
  sourceId: string,
): CircleLayerSpecification => ({
  id: layerId,
  type: 'circle',
  source: sourceId,
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': 'rgba(255, 255, 255, 0.55)',
    'circle-radius': 1.55,
    'circle-blur': 0.2,
    'circle-translate': [-1.2, -1.2],
    'circle-opacity': singletonOpacity,
  },
})

export const unclusteredPointHitLayer = (
  layerId: string,
  sourceId: string,
): CircleLayerSpecification => ({
  id: layerId,
  type: 'circle',
  source: sourceId,
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': '#ffffff',
    'circle-radius': 14,
    'circle-opacity': 0,
    'circle-stroke-width': 0,
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

export const clusterTextSize = (maxCount: number): ExpressionSpecification => {
  const highestCount = Math.max(Math.ceil(maxCount / 20) * 20, 20);
  return [
    'interpolate',
    ['linear'],
    ['get', 'point_count'],
    10, 10,
    highestCount, 18,
  ];
};

