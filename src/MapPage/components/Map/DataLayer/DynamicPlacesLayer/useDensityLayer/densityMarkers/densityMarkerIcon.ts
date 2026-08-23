
interface PinAnim {
    staggerMs: number;
    /** If set, pin uses fly-in animation starting at this screen offset from its own position. */
    startOffset?: { dx: number; dy: number };
}

// Per-resolution pin size range [minW, maxW] in pixels. Height = width * 1.25.
export const DEFAULT_PIN_RANGE: [number, number] = [20, 48];
export const PIN_RANGE_BY_RESOLUTION: Record<number, [number, number]> = {
  7:  [25, 75],
  8:  [25, 65],
  9:  [25, 55],
  10: [25, 45],
};

const OPACITY_RANGE = [0.45, 0.65]; // min, max
const OPACITY_RANGE2 = [0.45, 0.65]; // min, max
const FONT_WEIGHT_RANGE = [500, 500]; // min, max
const RGB = [255, 255, 255]; // white
const PIN_STROKE_WIDTH = 0.25;

const densityMarkerIcon = (count: number, resolution: number, maxCount: number, anim: PinAnim, rgb = RGB): HTMLDivElement => {
    
    const label = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count);
    const fs = label.length > 3 ? 10 : label.length > 2 ? 12 : 14;
    const { staggerMs, startOffset } = anim;

    const animClass = startOffset ? 'density-pin-fly-in' : 'density-pin-enter';
    const styleExtra = startOffset
        ? `animation-delay:${staggerMs}ms;--fly-dx:${startOffset.dx.toFixed(1)}px;--fly-dy:${startOffset.dy.toFixed(1)}px`
        : `animation-delay:${staggerMs}ms`;

    const [minW, maxW] = PIN_RANGE_BY_RESOLUTION[resolution] ?? DEFAULT_PIN_RANGE;
    const w = countToSize(count, maxCount, minW, maxW) 
    // shrink pins at zoom < 12 to reduce clutter
    const opacity = OPACITY_RANGE[0] + (count / maxCount) * (OPACITY_RANGE[1] - OPACITY_RANGE[0]);
    const primaryColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity.toFixed(2)})`;
    const secondaryColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${(OPACITY_RANGE2[0] + (count / maxCount) * (OPACITY_RANGE2[1] - OPACITY_RANGE2[0])).toFixed(2)})`;
    const fontWeight = Math.round(FONT_WEIGHT_RANGE[0] + (count / maxCount) * (FONT_WEIGHT_RANGE[1] - FONT_WEIGHT_RANGE[0]));
    
    // <circle cx="20" cy="20" r="20" fill="#ffffff00" stroke="white" stroke-width="0.25" stroke-dasharray="3 2"/>
    const element = document.createElement('div');
    element.innerHTML = `<div class="density-pin ${animClass}" style="${styleExtra}">
        <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${w}" viewBox="0 0 40 40" style="overflow:visible;display:block">
          <circle cx="20" cy="20" r="20" fill="#ffffff00" stroke="${secondaryColor}" stroke-width="${PIN_STROKE_WIDTH}" stroke-dasharray="3 2"/>
          <text x="20" y="20" text-anchor="middle" dominant-baseline="central"
            fill="${primaryColor}" font-family="system-ui,sans-serif" font-size="${fs}" font-weight="${fontWeight}">
              ${label}
          </text>
        </svg>
      </div>`;
      return element;
};
export default densityMarkerIcon;

export const countToSize = (count: number, maxCount: number, minW: number, maxW: number): number => {
  const t = maxCount > 1 ? Math.sqrt(count / maxCount) : 1;
  return Math.round(minW + t * (maxW - minW));
};
