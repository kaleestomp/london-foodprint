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


const placeMarkerIcon = (
  staggerMs?: number,
  nStartOffset?: { dx: number; dy: number }
): HTMLDivElement => {
  
  const markerSvg = PLACE_MARKER_SVG_BY_SHAPE[ACTIVE_SHAPE];
  const animClass  = nStartOffset ? 'density-pin-fly-in' : 'density-pin-enter';
  const styleExtra = nStartOffset
    ? `animation-delay:${Math.max(0, staggerMs ?? 0)}ms;--fly-dx:${nStartOffset.dx.toFixed(1)}px;--fly-dy:${nStartOffset.dy.toFixed(1)}px;transform-origin:50% 50%`
    : `animation-delay:${Math.max(0, staggerMs ?? 0)}ms;transform-origin:50% 50%`;

  const element = document.createElement('div');
  element.innerHTML = `<div class="density-pin ${animClass}" style="${styleExtra}">${markerSvg}</div>`;
  return element;
};

export default placeMarkerIcon;