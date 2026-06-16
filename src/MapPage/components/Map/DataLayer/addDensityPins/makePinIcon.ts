import L from 'leaflet';

interface PinAnim {
    staggerMs: number;
    /** If set, pin uses fly-in animation starting at this screen offset from its own position. */
    startOffset?: { dx: number; dy: number };
}

// Per-resolution pin size range [minW, maxW] in pixels. Height = width * 1.25.
export const DEFAULT_PIN_RANGE: [number, number] = [20, 48];
export const PIN_RANGE_BY_RESOLUTION: Record<number, [number, number]> = {
  7:  [22, 85],
  8:  [22, 70],
  9:  [22, 55],
  10: [22, 40],
};

const makePinIcon = (count: number, w: number, h: number, anim: PinAnim): L.DivIcon => {

    const label = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count);
    const fs = label.length > 3 ? 10 : label.length > 2 ? 12 : 14;
    const { staggerMs, startOffset } = anim;

    const animClass = startOffset ? 'density-pin-fly-in' : 'density-pin-enter';
    const styleExtra = startOffset
        ? `animation-delay:${staggerMs}ms;--fly-dx:${startOffset.dx.toFixed(1)}px;--fly-dy:${startOffset.dy.toFixed(1)}px`
        : `animation-delay:${staggerMs}ms`;

    return L.divIcon({
        className: '',
        iconSize: [w, h],
        iconAnchor: [w / 2, h],
        popupAnchor: [0, -h],
        html: `<div class="density-pin ${animClass}" style="${styleExtra}">
      <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 40 50" style="overflow:visible;display:block">
        <path d="M20,2 C10,2 2,10 2,20 C2,30 10,40 20,48 C30,40 38,30 38,20 C38,10 30,2 20,2 Z"
              fill="#1a936f" stroke="white" stroke-width="2.5"/>
        <text x="20" y="21" text-anchor="middle" dominant-baseline="central"
              fill="white" font-family="system-ui,sans-serif" font-size="${fs}" font-weight="700">${label}</text>
      </svg>
    </div>`,
    });
};
export default makePinIcon;

export const countToSize = (count: number, maxCount: number, minW: number, maxW: number): [number, number] => {
  const t = maxCount > 1 ? Math.sqrt(count / maxCount) : 1;
  const w = Math.round(minW + t * (maxW - minW));
  return [w, Math.round(w * 1.25)];
};
