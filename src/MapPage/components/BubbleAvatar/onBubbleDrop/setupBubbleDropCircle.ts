import L from 'leaflet';

import { SEARCH_RADIUS, CIRCLE_COLOR } from '../config';

const CIRCLE_ENTRY_MS = 280;

type SetupArgs = {
  map: L.Map;
  lat: number;
  lng: number;
  entryDelayMs: number;
};

const setupBubbleDropCircle = ({ map, lat, lng, entryDelayMs }: SetupArgs) => {
  let circleAnimFrame: number | null = null;
  let circleStartTimer: ReturnType<typeof setTimeout> | null = null;

  // Start hidden so the circle does not flash before the delayed entry animation.
  const circle = L.circle([lat, lng], {
    radius:    1,
    color:     CIRCLE_COLOR,
    weight:    4.0,
    fill:      false,
    dashArray: '10 10',
    opacity:   0,
  }).addTo(map);

  const startCircleIn = () => {
    const startTs = performance.now();
    const animateCircleIn = (ts: number) => {
      const t = Math.min((ts - startTs) / CIRCLE_ENTRY_MS, 1);
      const eased = 1 - (1 - t) ** 3;
      circle.setRadius(Math.max(1, SEARCH_RADIUS * eased));
      circle.setStyle({ opacity: 0.16 + 0.84 * eased });

      if (t < 1) {
        circleAnimFrame = window.requestAnimationFrame(animateCircleIn);
      }
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
    map.removeLayer(circle);
  };
};

export default setupBubbleDropCircle;