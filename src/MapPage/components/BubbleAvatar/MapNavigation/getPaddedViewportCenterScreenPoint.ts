import type maplibregl from 'maplibre-gl';

import type { Point } from '../config';

const getPaddedViewportCenterScreenPoint = (
  map: maplibregl.Map,
  bottomPadding: number,
): Point => {
  const rect = map.getContainer().getBoundingClientRect();
  const clampedBottomPadding = Math.max(0, Math.min(bottomPadding, rect.height));

  return {
    x: rect.left + (rect.width / 2),
    y: rect.top + ((rect.height - clampedBottomPadding) / 2),
  };
};

export default getPaddedViewportCenterScreenPoint;
