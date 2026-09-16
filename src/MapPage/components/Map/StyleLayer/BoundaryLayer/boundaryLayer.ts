import type * as maplibregl from 'maplibre-gl';
import { primaryRed } from '../../../../../utils/styling/Colors';

const FILL_COLOR = '#1f82c0'; // --app-primary-blue
const LINE_COLOR = primaryRed;

export const boundaryLineLayer = (
  layerId: string,
  sourceId: string,
): maplibregl.LineLayerSpecification => ({
  id: layerId,
  type: 'line',
  source: sourceId,
  paint: {
    'line-color': LINE_COLOR,
    'line-width': 2,
    // 'line-opacity': 0.85,
    'line-dasharray': [2, 1.5],
  },
});

export const boundaryFillLayer = (
  layerId: string,
  sourceId: string,
): maplibregl.FillLayerSpecification => ({
  id: layerId,
  type: 'fill',
  source: sourceId,
  paint: {
    'fill-color': FILL_COLOR,
    'fill-opacity': 0.12,
  },
});


