// Snap positions
export const MOBILE_PEEK_PX = 56;          //72 closed: only the handle bar is visible
export const MOBILE_OPEN_HEIGHT_RATIO = 0.5;   // preview: 50% of screen height
export const MOBILE_FULL_TOP_GAP_PX = 90;  // full: this many px remain above the panel

export type SnapState = 'closed' | 'open';
export type DragSource = 'panel' | 'handle' | 'content';


export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export const getClosedOffsetForHeight = (viewportHeight: number) => {
  const sheetHeight = Math.max(MOBILE_PEEK_PX, Math.round(viewportHeight * MOBILE_OPEN_HEIGHT_RATIO));
  return Math.max(0, sheetHeight - MOBILE_PEEK_PX);
};