import L from 'leaflet';
// Fixed marker size for individual places.
export const PIN_W = 14;
export const PIN_H = 14;

type PlaceMarkerShape = 'dot';
const ACTIVE_SHAPE: PlaceMarkerShape = 'dot';

const PLACE_MARKER_SVG_BY_SHAPE: Record<PlaceMarkerShape, string> = {
  dot: `
    <svg xmlns="http://www.w3.org/2000/svg" width="${PIN_W}" height="${PIN_H}" viewBox="0 0 24 24" style="overflow:visible;display:block">
      <circle cx="10" cy="10" r="5" fill="#ffffff" stroke="#101010" stroke-width="0.5" />
    </svg>
  `,
};

type PlacePinAnim = {
  staggerMs?: number;
  startOffset?: { dx: number; dy: number };
};

const makePlacePinIcon = (anim: PlacePinAnim = {}): L.DivIcon => {
  const staggerMs = Math.max(0, anim.staggerMs ?? 0);
  const { startOffset } = anim;
  const animClass  = startOffset ? 'density-pin-fly-in' : 'density-pin-enter';
  const styleExtra = startOffset
    ? `animation-delay:${staggerMs}ms;--fly-dx:${startOffset.dx.toFixed(1)}px;--fly-dy:${startOffset.dy.toFixed(1)}px;transform-origin:50% 50%`
    : `animation-delay:${staggerMs}ms;transform-origin:50% 50%`;

  const markerSvg = PLACE_MARKER_SVG_BY_SHAPE[ACTIVE_SHAPE];

  return L.divIcon({
    className: '',
    iconSize:    [PIN_W, PIN_H],
    iconAnchor:  [PIN_W / 2, PIN_H / 2],
    popupAnchor: [0, -(PIN_H / 2)],
    html: `<div class="density-pin ${animClass}" style="${styleExtra}">${markerSvg}</div>`,
  });
};

export default makePlacePinIcon;