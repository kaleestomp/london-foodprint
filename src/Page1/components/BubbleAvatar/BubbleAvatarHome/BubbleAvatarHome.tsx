import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useDragControls } from 'framer-motion';
import L from 'leaflet';
import useBubbleDrag from '../useDragAndDrop/useBubbleDrag';
import useHomeProximity from './useHomeProximity';
import useBubbleHomeEyes from '../useEyeAnimations/useBubbleHomeEyes';
import useBubbleFlightAnimation from './useBubbleFlightAnimation';
import { getHomeCenter, HOME_SNAP_RADIUS } from '../config';
import DashedCircle from '../DashedCircle/DashedCircle';
import './BubbleAvatarHome.css';

type Props = {
  mapRef: React.RefObject<L.Map | null>;
  onDrop?: (lat: number, lng: number) => void;
  /** Fires when drag starts (true) or ends / snaps back (false) */
  onDraggingChange?: (isDragging: boolean) => void;
  /** Current near-home state from parent */
  isNearHome?: boolean;
  /** Fires with true/false as the bubble enters/leaves the home snap zone */
  onNearHomeChange?: (isNearHome: boolean) => void;
  /**
   * When set, the button mounts at this screen coordinate instead of its
   * fixed home position, and immediately enters drag state. Used after
   * picking up the map avatar — the user's pointer is already held down there.
   */
  pickupFrom?: { x: number; y: number };
  /** Spawn animation source when returning home via reset action */
  flyInFrom?: { x: number; y: number };
  /** Fires after one-shot fly-in animation completes */
  onFlyInComplete?: () => void;
  /** Fires when released off the map while in pickupFrom mode (no snap-back needed) */
  onDropCancel?: () => void;
  /** When set, animate the bubble FROM home TO this screen position, then fire onFlyOutComplete */
  flyOutTo?: { x: number; y: number };
  /** Fires after the fly-out animation completes */
  onFlyOutComplete?: () => void;
};

const BubbleHome: React.FC<Props> = ({ mapRef, onDrop, onDraggingChange, isNearHome = false, onNearHomeChange, pickupFrom, flyInFrom, onFlyInComplete, onDropCancel, flyOutTo, onFlyOutComplete }) => {
  const bubbleRef     = useRef<HTMLDivElement>(null);
  const dragControls  = useDragControls();
  const firedPickupRef = useRef(false);
  const hasDragStartedRef = useRef(false);

  const handleDrop = useCallback(
    (lat: number, lng: number) => onDrop?.(lat, lng),
    [onDrop],
  );

  const { isDragging, dragPos, handleDragStart, handleDrag, handleDragEnd } =
    useBubbleDrag(mapRef, handleDrop, onDropCancel);

  const handleDragStartWrapped = useCallback(() => {
    hasDragStartedRef.current = true;
    handleDragStart();
  }, [handleDragStart]);

  // Notify parent whenever drag state changes so it can show BubbleHomeGhost
  const isPickupPending = !!pickupFrom && !isDragging;
  const isVisuallyDragging = isDragging || isPickupPending;
  useEffect(() => {
    onDraggingChange?.(isVisuallyDragging);
  }, [isVisuallyDragging, onDraggingChange]);

  // Detect when drag enters/leaves the home snap zone and notify parent.
  useHomeProximity(isDragging, dragPos, onNearHomeChange);

  // Resolves pickup mode when pointer is released before Framer drag starts.
  // This prevents a "hovering" avatar when pickup succeeds but drag events don't fire.
  const resolvePickupWithoutDrag = useCallback((x: number, y: number) => {
    const map = mapRef.current;
    if (!map) {
      onDropCancel?.();
      return;
    }

    const home = getHomeCenter();
    const distToHome = Math.sqrt((x - home.x) ** 2 + (y - home.y) ** 2);

    // Near home: cancel pickup and return to home button.
    if (distToHome < HOME_SNAP_RADIUS) {
      onDropCancel?.();
      return;
    }

    const mapRect = map.getContainer().getBoundingClientRect();
    const droppedOnMap =
      x >= mapRect.left && x <= mapRect.right &&
      y >= mapRect.top  && y <= mapRect.bottom;

    if (droppedOnMap) {
      const leafletPoint = L.point(x - mapRect.left, y - mapRect.top);
      const latLng = map.containerPointToLatLng(leafletPoint);
      onDrop?.(latLng.lat, latLng.lng);
    } else {
      onDropCancel?.();
    }
  }, [mapRef, onDrop, onDropCancel]);

  // When mounted at a pickup position, programmatically start the Framer Motion
  // drag using the real pointer coordinates. The user's pointer is still held
  // down at pickupFrom, so dragControls.start() picks up the live gesture.
  useEffect(() => {
    if (!pickupFrom || firedPickupRef.current) return;
    firedPickupRef.current = true;
    hasDragStartedRef.current = false;
    requestAnimationFrame(() => {
      dragControls.start(
        new PointerEvent('pointerdown', {
          bubbles:    true,
          cancelable: true,
          clientX:    pickupFrom.x,
          clientY:    pickupFrom.y,
          pointerId:  1,
          isPrimary:  true,
        }),
      );
    });
  }, [pickupFrom, dragControls]);

  // If pickup mode was entered but Framer drag never started (e.g. pointer timing
  // edge case), resolve on pointerup so avatar never stays hovering.
  useEffect(() => {
    if (!pickupFrom) return;

    const onPointerUp = (e: PointerEvent) => {
      if (hasDragStartedRef.current) return;
      resolvePickupWithoutDrag(e.clientX, e.clientY);
    };

    window.addEventListener('pointerup', onPointerUp, { once: true });
    return () => window.removeEventListener('pointerup', onPointerUp);
  }, [pickupFrom, resolvePickupWithoutDrag]);

  // Override CSS positioning when mounted at a pickup location.
  // The 32 px offset centres the 64 px circle on the pointer.
  const pickupStyle = pickupFrom
    ? { bottom: 'auto' as const, left: pickupFrom.x - 32, top: pickupFrom.y - 32, marginLeft: 0 }
    : undefined;

  const {
    initial,
    animate,
    transition,
    dragEnabled,
    handleAnimationComplete,
  } = useBubbleFlightAnimation({
    pickupFrom,
    flyInFrom,
    flyOutTo,
    onFlyInComplete,
    onFlyOutComplete,
  });

  const { isSmileEye, eyeScaleY, eyeX, eyeY, isBlinking } = useBubbleHomeEyes({
    bubbleRef,
    isDragging,
    isVisuallyDragging,
  });

  const [isCoarsePointer, setIsCoarsePointer] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
  );

  useEffect(() => {
    const media = window.matchMedia('(pointer: coarse)');
    const update = () => setIsCoarsePointer(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const whileDragVisual = useMemo(
    () => (isCoarsePointer
      ? { scale: 1.03, boxShadow: '0 2px 8px rgba(0,0,0,0.14)' }
      : { scale: 1.18, boxShadow: '0 10px 36px rgba(0,0,0,0.22), 0 3px 10px rgba(0,0,0,0.12)' }),
    [isCoarsePointer],
  );

  return (
    <>
      {/* ── Floating bubble ─────────────────────────────────────────────── */}
      <motion.div
        ref={bubbleRef}
        className={`bubble-btn${isDragging ? ' is-dragging' : ''}`}
        style={pickupStyle}
        initial={initial}
        animate={animate}
        transition={transition}
        onAnimationComplete={handleAnimationComplete}
        drag={dragEnabled}
        dragControls={dragControls}
        dragSnapToOrigin={!pickupFrom}
        dragElastic={isCoarsePointer ? 0.02 : 0.12}
        dragMomentum={false}
        dragTransition={{ bounceStiffness: 320, bounceDamping: 28 }}
        whileTap={{ scale: isCoarsePointer ? 0.96 : 0.88 }}
        whileDrag={whileDragVisual}
        onDragStart={handleDragStartWrapped}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        role="button"
        aria-label="Drag to explore an area"
      >
        <div className="bubble-inner">
          <div className="bubble-face">
            <div className="bubble-eyes">

              {/* Left eye */}
              <motion.div
                className={`bubble-eye${isSmileEye ? ' is-smile' : ''}`}
                animate={{ x: eyeX, y: eyeY, scaleY: eyeScaleY }}
                transition={{
                  x:      { type: 'spring', stiffness: 200, damping: 20 },
                  y:      { type: 'spring', stiffness: 200, damping: 20 },
                  scaleY: { duration: 0.13 },
                }}
              />

              {/* Right eye — 40 ms stagger on blink close only */}
              <motion.div
                className={`bubble-eye${isSmileEye ? ' is-smile' : ''}`}
                animate={{ x: eyeX, y: eyeY, scaleY: eyeScaleY }}
                transition={{
                  x:      { type: 'spring', stiffness: 200, damping: 20 },
                  y:      { type: 'spring', stiffness: 200, damping: 20 },
                  scaleY: { duration: 0.13, delay: isBlinking ? 0.04 : 0 },
                }}
              />

            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Drop-ring overlay (follows pointer while dragging) ───────────── */}
      {isDragging && dragPos && !isNearHome && (
        <DashedCircle
          className="bubble-btn-drop-ring"
          style={{ left: dragPos.x, top: dragPos.y }}
        />
      )}

      {isPickupPending && pickupFrom && (
        <DashedCircle
          className="bubble-btn-drop-ring"
          style={{ left: pickupFrom.x, top: pickupFrom.y }}
        />
      )}
    </>
  );
};

export default BubbleHome;
