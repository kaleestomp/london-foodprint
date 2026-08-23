import type maplibregl from 'maplibre-gl';

import { type Point } from '../config';

const TOP_PADDING = 80;

const getVisibleMapTargetScreenPoint = (
  map: maplibregl.Map,
  isMobile: boolean,
  panelHeight: number,
  translateY: number,
): Point | undefined => {
  if (!isMobile) return undefined;

  const mapRect = map.getContainer().getBoundingClientRect();
  const panelTop = window.innerHeight - panelHeight + translateY + TOP_PADDING;
  const visibleMapBottom = Math.min(mapRect.bottom, panelTop);
  if (visibleMapBottom <= mapRect.top) return undefined;

  return {
    x: mapRect.left + (mapRect.width / 2),
    y: mapRect.top + ((visibleMapBottom - mapRect.top) / 2),
  };
};

export default getVisibleMapTargetScreenPoint;