import type maplibregl from 'maplibre-gl';
import type { ExpressionSpecification } from 'maplibre-gl';

const updateTextSize = (
    map: maplibregl.Map,
    layerId: string
) => {
    if (!map.getLayer(layerId)) return;

    const clusters = map.queryRenderedFeatures(undefined, { layers: [layerId] });
    const highestCount = clusters.reduce((highest, feature) => {
        const count = Number(feature.properties?.point_count ?? 0);
        return Math.max(highest, count);
    }, 0);
    map.setLayoutProperty(layerId, 'text-size', clusterTextSize(highestCount));
};

const clusterTextSize = (maxCount: number): ExpressionSpecification => {
  const highestCount = Math.max(Math.ceil(maxCount / 10) * 10, 20);
  return [
    'interpolate',
    ['linear'],
    ['get', 'point_count'],
    10, 10,
    highestCount, 14,
  ];
};

export default updateTextSize;