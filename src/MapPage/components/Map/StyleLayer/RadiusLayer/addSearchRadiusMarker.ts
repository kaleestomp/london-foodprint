import type * as maplibregl from 'maplibre-gl';

import PolygonMask from '../polygonMask/polygonMask';
import { WORLD_RING } from '../polygonMask/geometry';
import buildCircleHole from '../polygonMask/buildCircleHole';


const CIRCLE_ENTRY_MS = 280;
const OUTSIDE_MASK_OPACITY = 0.48;

const addSearchRadiusMarker = (
  map: maplibregl.Map,
  lat: number,
  lng: number,
  radius: number,
  entryDelayMs: number,
) => {
  let circleAnimFrame: number | null = null;
  let circleStartTimer: ReturnType<typeof setTimeout> | null = null;
  const outsideMask = PolygonMask(map, lat, lng);

  const startCircleIn = () => {
    const startTs = performance.now();
    const animateCircleIn = (ts: number) => {
      const t = Math.min((ts - startTs) / CIRCLE_ENTRY_MS, 1);
      const eased = 1 - (1 - t) ** 3;
      const animatedRadius = Math.max(1, radius * eased);

      outsideMask.setLatLngs([WORLD_RING, buildCircleHole(lat, lng, animatedRadius)]);
      outsideMask.setStyle({ fillOpacity: OUTSIDE_MASK_OPACITY * eased });

      if (t < 1) circleAnimFrame = window.requestAnimationFrame(animateCircleIn);
    };

    circleAnimFrame = window.requestAnimationFrame(animateCircleIn);
  };

  if (entryDelayMs > 0) {
    circleStartTimer = setTimeout(startCircleIn, entryDelayMs);
  } else {
    startCircleIn();
  }

  return () => {
    if (circleStartTimer) clearTimeout(circleStartTimer);
    if (circleAnimFrame !== null) window.cancelAnimationFrame(circleAnimFrame);
    outsideMask.remove();
  };
};

export default addSearchRadiusMarker;