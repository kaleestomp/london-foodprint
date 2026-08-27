import { useEffect, useRef, useCallback } from 'react';
import type maplibregl from 'maplibre-gl';

import { useBubbleAvatarState } from '../BubbleAvatarStateContext';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import useGetEdgeState from './useGetEdgeState';
import { LONGPRESS_MS } from '../config';

import './BubbleEdgeIndicator.css';

/**
 * Renders a small speech-bubble at the nearest viewport edge when the map
 * avatar is off-screen.
 *  - Tap/click          → map.setView() back to avatar
 *  - Long press (LONGPRESS_MS ms) → pick up the avatar (same state as map long-press)
 */
type Props = { mapRef: React.RefObject<maplibregl.Map | null> };
const BubbleEdgeIndicator: React.FC<Props> = ({ mapRef }) => {
  const { handlePickup } = useBubbleAvatarState();
  
  const { searchMask } = useSearchFilters();
  const edgeState = useGetEdgeState(mapRef, searchMask?.center);

  // Stable refs — avoid re-registering map listeners when callbacks change
  const handlePickupRef   = useRef(handlePickup);
  const edgeStateRef      = useRef(edgeState);
  const longPressTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasLongPress      = useRef(false);
  // Cached container rect — the container doesn't move during pan/zoom,
  // so we only re-read it on resize rather than on every map move event.

  useEffect(() => { handlePickupRef.current = handlePickup; }, [handlePickup]);
  useEffect(() => { edgeStateRef.current = edgeState;  }, [edgeState]);

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
    const center = searchMask?.center;
    if (!map || !center) return;

    const target: maplibregl.LngLatLike = [center.lng, center.lat];
    map.panTo(target, { animate: true });
    
  }, [mapRef, searchMask, cancelLongPress]);

  return (
    edgeState ? (
      <button
        key={`edge-indicator-${edgeState.edge}`}
        className={`bubble-edge-indicator is-visible edge-${edgeState.edge}`}
        style={{ left: edgeState.x, top: edgeState.y }}
        onPointerDown={handlePointerDown}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onPointerCancel={cancelLongPress}
        onClick={handleClick}
        aria-label="Navigate back to avatar"
      >
        <div className="bubble-edge-eyes">
          <div className="bubble-edge-eye" />
          <div className="bubble-edge-eye" />
        </div>
      </button>
    ) : null
  );
};

export default BubbleEdgeIndicator;
