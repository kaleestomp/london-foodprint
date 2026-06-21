export type LatLng = { lat: number; lng: number };
export type Point = { x: number; y: number };

type HomeCenterCache = {
  width: number;
  height: number;
  center: Point;
};

let homeCenterCache: HomeCenterCache | null = null;

/** Screen coordinates of BubbleButton's fixed home centre */
export const getHomeCenter = (): Point => {
  if (typeof window === 'undefined') {
    return {
      x: 0,
      y: 0,
    };
  }

  const { innerWidth: width, innerHeight: height } = window;
  if (
    homeCenterCache
    && homeCenterCache.width === width
    && homeCenterCache.height === height
  ) {
    return homeCenterCache.center;
  }

  if (typeof document !== 'undefined') {
    const probe = document.createElement('div');
    probe.className = 'bubble-avatar-root bubble-btn';
    probe.style.visibility = 'hidden';
    probe.style.pointerEvents = 'none';
    probe.style.position = 'fixed';
    document.body.appendChild(probe);

    try {
      const rect = probe.getBoundingClientRect();
      const center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      homeCenterCache = { width, height, center };
      return center;
    } finally {
      document.body.removeChild(probe);
    }
  }

  const center = {
    x: width / 2,
    y: height - 70,
  };
  homeCenterCache = { width, height, center };
  return center;
};