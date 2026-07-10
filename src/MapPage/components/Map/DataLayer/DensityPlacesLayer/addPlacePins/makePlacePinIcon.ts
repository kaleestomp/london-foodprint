import L from 'leaflet';
// Fixed pin size for individual places — smaller than density pins so they
// don't overwhelm the map when many are shown at once.
export const PIN_W = 22;
export const PIN_H = 28;

type PlacePinAnim = {
  staggerMs?: number;
  startOffset?: { dx: number; dy: number };
};

const makePlacePinIcon = (anim: PlacePinAnim = {}): L.DivIcon => {
  const staggerMs = Math.max(0, anim.staggerMs ?? 0);
  const { startOffset } = anim;
  const animClass  = startOffset ? 'density-pin-fly-in' : 'density-pin-enter';
  const styleExtra = startOffset
    ? `animation-delay:${staggerMs}ms;--fly-dx:${startOffset.dx.toFixed(1)}px;--fly-dy:${startOffset.dy.toFixed(1)}px`
    : `animation-delay:${staggerMs}ms`;

  return L.divIcon({
    className: '',
    iconSize:    [PIN_W, PIN_H],
    iconAnchor:  [PIN_W / 2, PIN_H],
    popupAnchor: [0, -PIN_H],
    html: `<div class="density-pin ${animClass}" style="${styleExtra}">
      <svg xmlns="http://www.w3.org/2000/svg" width="${PIN_W}" height="${PIN_H}" viewBox="0 0 40 50" style="overflow:visible;display:block">
        <path d="M20,2 C10,2 2,10 2,20 C2,30 10,40 20,48 C30,40 38,30 38,20 C38,10 30,2 20,2 Z"
              fill="#114b5f" stroke="white" stroke-width="2.5"/>
        <circle cx="20" cy="20" r="6" fill="white" opacity="0.9"/>
      </svg>
    </div>`,
  });
};

export default makePlacePinIcon;