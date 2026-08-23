import type maplibregl from 'maplibre-gl';

import { WORLD_RING, buildCircleHole, PolygonMask } from './polygonMask';
// import CircleMarker from './circleMarker';
const CIRCLE_ENTRY_MS = 280;
const OUTSIDE_MASK_OPACITY = 0.24;

const addSearchRadiusMarker = (
  map: maplibregl.Map,
  lat: number,
  lng: number,
  radius: number,
  entryDelayMs: number
) => {

  let circleAnimFrame: number | null = null;
  let circleStartTimer: ReturnType<typeof setTimeout> | null = null;

  // START HIDDEN 
  // so the circle does not flash before the delayed entry animation.
  // const circle = CircleMarker(map, lat, lng).addTo(map);
  // Darkens everything outside the active search radius.
  const outsideMask = PolygonMask(map, lat, lng);

  // ANIMATION LOGIC
  const startCircleIn = () => {
    const startTs = performance.now();
    const animateCircleIn = (ts: number) => {
      const t = Math.min((ts - startTs) / CIRCLE_ENTRY_MS, 1);
      const eased = 1 - (1 - t) ** 3;
      const animatedRadius = Math.max(1, radius * eased);

      // circle.setRadius(animatedRadius);
      // circle.setStyle({ opacity: 0.16 + 0.84 * eased });
      outsideMask.setLatLngs([WORLD_RING, buildCircleHole(lat, lng, animatedRadius)]);
      outsideMask.setStyle({ fillOpacity: OUTSIDE_MASK_OPACITY * eased });

      if (t < 1) 
        circleAnimFrame = window.requestAnimationFrame(animateCircleIn);
    };

    circleAnimFrame = window.requestAnimationFrame(animateCircleIn);
  };

  // START ANIMATION
  if (entryDelayMs > 0) {
    circleStartTimer = setTimeout(startCircleIn, entryDelayMs);
  } else {
    startCircleIn();
  }

  // CLEANUP
  const cleanup = () => {
    if (circleStartTimer) clearTimeout(circleStartTimer);
    if (circleAnimFrame !== null) window.cancelAnimationFrame(circleAnimFrame);
    outsideMask.remove();
    // map.removeLayer(circle);
  };

  return cleanup;
};

export default addSearchRadiusMarker;