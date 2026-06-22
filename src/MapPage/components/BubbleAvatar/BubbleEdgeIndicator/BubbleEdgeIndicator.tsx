import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import L from 'leaflet';
import { LONGPRESS_MS, INDICATOR_R } from '../config';
import { useBubbleAvatarState } from '../BubbleAvatarStateContext';
import './BubbleEdgeIndicator.css';

type Edge = 'top' | 'bottom' | 'left' | 'right';
type EdgeState = { x: number; y: number; edge: Edge } | null;

// Visual offset calibration: top/left appears more inset than expected while
// right/bottom appears less inset (can overflow). Gate inset scaling by side.
const EDGE_INSET_TL_SCALE = 0.45;
const EDGE_INSET_BR_SCALE = 2.4;
const EDGE_INSET_LEFT = INDICATOR_R * EDGE_INSET_TL_SCALE;
const EDGE_INSET_TOP = INDICATOR_R * EDGE_INSET_TL_SCALE + 80;
const EDGE_INSET_RIGHT = INDICATOR_R * EDGE_INSET_BR_SCALE;
const EDGE_INSET_BOTTOM = INDICATOR_R * EDGE_INSET_BR_SCALE;

/**
 * Given the avatar's projected screen coordinates (possibly off-screen),
 * trace a ray from the viewport centre to the avatar and find where it
 * hits the viewport boundary. Returns the clamped edge position and which
 * edge was hit (used to orient the speech-bubble tail).
 */
const computeEdgeState = (
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
  const tLeft   = dx < 0 ? (EDGE_INSET_LEFT - cx) / dx : Infinity;
  const tRight  = dx > 0 ? (W - EDGE_INSET_RIGHT - cx) / dx : Infinity;
  const tTop    = dy < 0 ? (EDGE_INSET_TOP - cy) / dy : Infinity;
  const tBottom = dy > 0 ? (H - EDGE_INSET_BOTTOM - cy) / dy : Infinity;

  const tH = dx < 0 ? tLeft : tRight;
  const tV = dy < 0 ? tTop  : tBottom;
  const t  = Math.min(tH, tV);

  const x = cx + t * dx;
  const y = cy + t * dy;

  const edge: Edge = tH < tV
    ? (dx < 0 ? 'left'  : 'right')
    : (dy < 0 ? 'top'   : 'bottom');

  return { x, y, edge };
};

type Props = {
  mapRef: React.RefObject<L.Map | null>;
};

/**
 * Renders a small speech-bubble at the nearest viewport edge when the map
 * avatar is off-screen.
 *  - Tap/click          → map.setView() back to avatar
 *  - Long press (LONGPRESS_MS ms) → pick up the avatar (same state as map long-press)
 */
const BubbleEdgeIndicator: React.FC<Props> = ({ mapRef }) => {
  const { droppedPos, handlePickup } = useBubbleAvatarState();
  const [edgeState, setEdgeState] = useState<EdgeState>(null);

  // Stable refs — avoid re-registering map listeners when callbacks change
  const handlePickupRef = useRef(handlePickup);
  const edgeStateRef   = useRef(edgeState);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasLongPress   = useRef(false);

  useEffect(() => { handlePickupRef.current = handlePickup; }, [handlePickup]);
  useEffect(() => { edgeStateRef.current = edgeState;  }, [edgeState]);

  // ── Track avatar screen position on every map move ─────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !droppedPos) return;

    const update = () => {
      const pt   = map.latLngToContainerPoint([droppedPos.lat, droppedPos.lng]);
      const rect = map.getContainer().getBoundingClientRect();
      const sx   = pt.x + rect.left;
      const sy   = pt.y + rect.top;
      const W    = window.innerWidth;
      const H    = window.innerHeight;

      const inView =
        sx >= EDGE_INSET_LEFT && sx <= W - EDGE_INSET_RIGHT &&
        sy >= EDGE_INSET_TOP && sy <= H - EDGE_INSET_BOTTOM;

      setEdgeState(inView ? null : computeEdgeState(sx, sy, W, H));
    };

    map.on('move', update);
    update(); // evaluate immediately on mount / droppedPos change

    return () => { map.off('move', update); };
  }, [mapRef, droppedPos]);

  // ── Long-press helpers ─────────────────────────────────────────────────
  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    wasLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      wasLongPress.current = true;
      longPressTimer.current = null;
      const state = edgeStateRef.current;
      if (state) handlePickupRef.current(state.x, state.y);
    }, LONGPRESS_MS);
  }, []);

  const handleClick = useCallback(() => {
    cancelLongPress();
    if (wasLongPress.current) return; // long-press already handled
    const map = mapRef.current;
    if (map && droppedPos) map.setView([droppedPos.lat, droppedPos.lng], 16, { animate: true });
  }, [mapRef, droppedPos, cancelLongPress]);

  return (
    <>
      <AnimatePresence>
        {edgeState && (
          <motion.button
            key={`edge-indicator-${edgeState.edge}`}
            className={`bubble-edge-indicator edge-${edgeState.edge}`}
            style={{ left: edgeState.x, top: edgeState.y }}
            onPointerDown={handlePointerDown}
            onPointerUp={cancelLongPress}
            onPointerLeave={cancelLongPress}
            onPointerCancel={cancelLongPress}
            onClick={handleClick}
            aria-label="Navigate back to avatar"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="bubble-edge-eyes">
              <div className="bubble-edge-eye" />
              <div className="bubble-edge-eye" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};

export default BubbleEdgeIndicator;
