import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useDragControls } from 'framer-motion';
import L from 'leaflet';
import useBubbleDrag from '../useDragAndDrop/useBubbleDrag';
import useHomeProximity from './useHomeProximity';
import useBubbleHomeEyes from '../useEyeAnimations/useBubbleHomeEyes';
import useBubbleFlightAnimation from './useBubbleFlightAnimation';
import { useBubbleAvatarState } from '../BubbleAvatarStateContext';
import { getHomeCenter, HOME_SNAP_RADIUS } from '../config';
import DashedCircle from '../DashedCircle/DashedCircle';
import './BubbleAvatarHome.css';

type Props = {
  mapRef: React.RefObject<L.Map | null>;
  flight?: {
    /** Spawn animation source when returning home via reset action */
    flyInFrom?: { x: number; y: number };
    /** When set, animate the bubble FROM home TO this screen position, then fire onFlyOutComplete */
    flyOutTo?: { x: number; y: number };
    /** Fires after the fly-out animation completes */
    onFlyOutComplete?: () => void;
  };
};

const BubbleHome: React.FC<Props> = ({ mapRef, flight }) => {
  const { flyInFrom, flyOutTo, onFlyOutComplete } = flight ?? {};
  const {
    pickupPos,
    isDragging,
    isNearHome,
    setIsNearHome,
    handleDrop,
    handleDropCancel,
  } = useBubbleAvatarState();
  const bubbleRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const firedPickupRef = useRef(false);
  const rawDragPointerIdRef = useRef<number | null>(null);
  const rawDragActiveRef = useRef(false);

  const dragDropCallback = useCallback(
    (lat: number, lng: number) => handleDrop(lat, lng),
    [handleDrop],
  );

  const {
    dragPos,
    hasDragStarted,
    resetDragStarted,
    handleDragStart,
    handleDragStartAtPoint,
    handleDrag,
    handleDragMoveToPoint,
    handleDragEnd,
    handleDragEndAtPoint,
  } = useBubbleDrag(mapRef, dragDropCallback, handleDropCancel);

  // Detect when drag enters/leaves the home snap zone and UPDATE CONTEXT.
  useHomeProximity(isDragging, dragPos, setIsNearHome);

  const isPickupPending = !!pickupPos && !isDragging;
  const isVisuallyDragging = isDragging || isPickupPending;

  // Resolves pickup mode when pointer is released before Framer drag starts.
  // This prevents a "hovering" avatar when pickup succeeds but drag events don't fire.
  const resolvePickupWithoutDrag = useCallback((x: number, y: number) => {
    const map = mapRef.current;
    if (!map) {
      handleDropCancel();
      return;
    }

    const home = getHomeCenter();
    const distToHome = Math.sqrt((x - home.x) ** 2 + (y - home.y) ** 2);

    // Near home: cancel pickup and return to home button.
    if (distToHome < HOME_SNAP_RADIUS) {
      handleDropCancel();
      return;
    }

    const mapRect = map.getContainer().getBoundingClientRect();
    const droppedOnMap =
      x >= mapRect.left && x <= mapRect.right &&
      y >= mapRect.top && y <= mapRect.bottom;

    if (droppedOnMap) {
      const leafletPoint = L.point(x - mapRect.left, y - mapRect.top);
      const latLng = map.containerPointToLatLng(leafletPoint);
      handleDrop(latLng.lat, latLng.lng);
    } else {
      handleDropCancel();
    }
  }, [mapRef, handleDrop, handleDropCancel]);

  const {
    initial,
    animate,
    transition,
    dragEnabled,
    handleAnimationComplete,
  } = useBubbleFlightAnimation({
    pickupFrom: pickupPos ?? undefined,
    flyInFrom,
    flyOutTo,
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

  const rawDragEnabled = isCoarsePointer && dragEnabled;

  const endRawDrag = useCallback((x: number, y: number) => {
    rawDragActiveRef.current = false;
    rawDragPointerIdRef.current = null;
    handleDragEndAtPoint(x, y);
  }, [handleDragEndAtPoint]);

  const startRawDrag = useCallback((x: number, y: number, pointerId?: number) => {
    rawDragActiveRef.current = true;
    rawDragPointerIdRef.current = pointerId ?? null;
    handleDragStartAtPoint(x, y);
  }, [handleDragStartAtPoint]);

  useEffect(() => {
    if (!rawDragEnabled || !isDragging || !rawDragActiveRef.current) {
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      const activePointerId = rawDragPointerIdRef.current;
      if (activePointerId != null && event.pointerId !== activePointerId) {
        return;
      }

      if (activePointerId == null) {
        rawDragPointerIdRef.current = event.pointerId;
      }

      handleDragMoveToPoint(event.clientX, event.clientY);
    };

    const onPointerEnd = (event: PointerEvent) => {
      const activePointerId = rawDragPointerIdRef.current;
      if (activePointerId != null && event.pointerId !== activePointerId) {
        return;
      }

      endRawDrag(event.clientX, event.clientY);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerEnd);
    window.addEventListener('pointercancel', onPointerEnd);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerEnd);
      window.removeEventListener('pointercancel', onPointerEnd);
    };
  }, [endRawDrag, handleDragMoveToPoint, isDragging, rawDragEnabled]);

  // When mounted at a pickup position, programmatically start the Framer Motion
  // drag using the real pointer coordinates. The user's pointer is still held
  // down at pickupPos, so dragControls.start() picks up the live gesture.
  useEffect(() => {
    if (rawDragEnabled) return;
    if (!pickupPos || firedPickupRef.current) return;
    firedPickupRef.current = true;
    resetDragStarted();
    requestAnimationFrame(() => {
      dragControls.start(
        new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          clientX: pickupPos.x,
          clientY: pickupPos.y,
          pointerId: 1,
          isPrimary: true,
        }),
      );
    });
  }, [pickupPos, dragControls, rawDragEnabled, resetDragStarted]);

  useEffect(() => {
    if (!rawDragEnabled || !pickupPos || firedPickupRef.current) return;
    firedPickupRef.current = true;
    startRawDrag(pickupPos.x, pickupPos.y);
  }, [pickupPos, rawDragEnabled, startRawDrag]);

  // If pickup mode was entered but Framer drag never started (e.g. pointer timing
  // edge case), resolve on pointerup so avatar never stays hovering.
  useEffect(() => {
    if (rawDragEnabled) return;
    if (!pickupPos) return;

    const onPointerUp = (e: PointerEvent) => {
      if (hasDragStarted()) return;
      resolvePickupWithoutDrag(e.clientX, e.clientY);
    };

    window.addEventListener('pointerup', onPointerUp, { once: true });
    return () => window.removeEventListener('pointerup', onPointerUp);
  }, [pickupPos, rawDragEnabled, resolvePickupWithoutDrag, hasDragStarted]);

  // Override CSS positioning when mounted at a pickup location.
  // The 32 px offset centres the 64 px circle on the pointer.
  const pickupStyle = pickupPos
    ? { bottom: 'auto' as const, left: pickupPos.x - 32, top: pickupPos.y - 32, marginLeft: 0 }
    : undefined;
  const rawDragStyle = rawDragEnabled && isDragging && dragPos
    ? { bottom: 'auto' as const, left: dragPos.x - 32, top: dragPos.y - 32, marginLeft: 0 }
    : undefined;
  const bubbleStyle = rawDragStyle ?? pickupStyle;

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
        style={bubbleStyle}
        initial={initial}
        animate={animate}
        transition={transition}
        onAnimationComplete={handleAnimationComplete}
        drag={rawDragEnabled ? false : dragEnabled}
        dragControls={dragControls}
        dragSnapToOrigin={!pickupPos}
        dragElastic={isCoarsePointer ? 0.02 : 0.12}
        dragMomentum={false}
        dragTransition={{ bounceStiffness: 320, bounceDamping: 28 }}
        whileTap={{ scale: isCoarsePointer ? 0.96 : 0.88 }}
        whileDrag={whileDragVisual}
        onDragStart={rawDragEnabled ? undefined : handleDragStart}
        onDrag={rawDragEnabled ? undefined : handleDrag}
        onDragEnd={rawDragEnabled ? undefined : handleDragEnd}
        onPointerDown={rawDragEnabled ? (event) => {
          event.preventDefault();
          event.stopPropagation();
          startRawDrag(event.clientX, event.clientY, event.pointerId);
        } : undefined}
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
                  x: { type: 'spring', stiffness: 200, damping: 20 },
                  y: { type: 'spring', stiffness: 200, damping: 20 },
                  scaleY: { duration: 0.13 },
                }}
              />

              {/* Right eye — 40 ms stagger on blink close only */}
              <motion.div
                className={`bubble-eye${isSmileEye ? ' is-smile' : ''}`}
                animate={{ x: eyeX, y: eyeY, scaleY: eyeScaleY }}
                transition={{
                  x: { type: 'spring', stiffness: 200, damping: 20 },
                  y: { type: 'spring', stiffness: 200, damping: 20 },
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

      {isPickupPending && pickupPos && (
        <DashedCircle
          className="bubble-btn-drop-ring"
          style={{ left: pickupPos.x, top: pickupPos.y }}
        />
      )}
    </>
  );
};

export default BubbleHome;
