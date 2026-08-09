
type Edge = 'top' | 'bottom' | 'left' | 'right';
export type EdgeState = { x: number; y: number; edge: Edge } | null;
// Visual offset calibration: top/left appears more inset than expected while
// right/bottom appears less inset (can overflow). Gate inset scaling by side.
const INDICATOR_R = 26 + 14; // half of 52px + breathing room
const EDGE_INSET_TL_SCALE = 0.3;
const EDGE_INSET_BR_SCALE = 2.0;
const EDGE_INSET_LEFT = INDICATOR_R * EDGE_INSET_TL_SCALE;
const EDGE_INSET_TOP = INDICATOR_R * EDGE_INSET_TL_SCALE;
const EDGE_INSET_RIGHT = INDICATOR_R * EDGE_INSET_BR_SCALE;
const EDGE_INSET_BOTTOM = INDICATOR_R * EDGE_INSET_BR_SCALE;

/**
 * Given the avatar's projected screen coordinates (possibly off-screen),
 * trace a ray from the viewport centre to the avatar and find where it
 * hits the viewport boundary. Returns the clamped edge position and which
 * edge was hit (used to orient the speech-bubble tail).
 */
export const getEdgeState = (
    screenX: number,
    screenY: number,
    W: number,
    H: number,
): EdgeState => {
    const cx = W / 2;
    const cy = H / 2;
    const dx = screenX - cx;
    const dy = screenY - cy;
    if (dx === 0 && dy === 0) return null;

    // Parametric t for each boundary (ray: P = centre + t * direction)
    const tLeft = dx < 0 ? (EDGE_INSET_LEFT - cx) / dx : Infinity;
    const tRight = dx > 0 ? (W - EDGE_INSET_RIGHT - cx) / dx : Infinity;
    const tTop = dy < 0 ? (EDGE_INSET_TOP - cy) / dy : Infinity;
    const tBottom = dy > 0 ? (H - EDGE_INSET_BOTTOM - cy) / dy : Infinity;

    const tH = dx < 0 ? tLeft : tRight;
    const tV = dy < 0 ? tTop : tBottom;
    const t = Math.min(tH, tV);

    const x = cx + t * dx;
    const y = cy + t * dy;

    const edge: Edge = tH < tV
        ? (dx < 0 ? 'left' : 'right')
        : (dy < 0 ? 'top' : 'bottom');

    return { x, y, edge };
};

export const checkIsInView = (screenX: number, screenY: number, W: number, H: number): boolean => {
    return (
        screenX >= EDGE_INSET_LEFT && screenX <= W - EDGE_INSET_RIGHT &&
        screenY >= EDGE_INSET_TOP && screenY <= H - EDGE_INSET_BOTTOM
    );
}