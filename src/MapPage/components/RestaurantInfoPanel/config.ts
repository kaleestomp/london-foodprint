export const MOBILE_BREAKPOINT = 960;
export const MOBILE_ENTER_BREAKPOINT = MOBILE_BREAKPOINT - 24;
export const MOBILE_EXIT_BREAKPOINT = MOBILE_BREAKPOINT + 24;

// Snap positions
export const MOBILE_PEEK_PX = 72;          // closed: only the handle bar is visible
export const MOBILE_PREVIEW_RATIO = 0.5;   // preview: 50% of screen height
export const MOBILE_FULL_TOP_GAP_PX = 90;  // full: this many px remain above the panel

export const RESIZE_HEIGHT_JITTER_PX = 120;
export const RESIZE_WIDTH_JITTER_PX = 16;
export const COARSE_POINTER_QUERY = '(pointer: coarse)';

// Minimum pointer travel (px) before a touch is treated as a drag vs. a tap
export const TAP_THRESHOLD_PX = 6;