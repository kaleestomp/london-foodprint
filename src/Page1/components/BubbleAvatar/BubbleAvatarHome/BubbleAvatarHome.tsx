import { useCallback, useEffect, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import L from 'leaflet';
import useBubbleDrag from '../useDragAndDrop/useBubbleDrag';
import useEyeGaze from '../useEyeAnimations/useEyeGaze';
import useHomeProximity from './useHomeProximity';
import './BubbleAvatarHome.css';

type Props = {
  mapRef: React.RefObject<L.Map | null>;
  onDrop?: (lat: number, lng: number) => void;
  /** Fires when drag starts (true) or ends / snaps back (false) */
  onDraggingChange?: (isDragging: boolean) => void;
  /** Fires with true/false as the bubble enters/leaves the home snap zone */
  onNearHomeChange?: (isNearHome: boolean) => void;
  /**
   * When set, the button mounts at this screen coordinate instead of its
   * fixed home position, and immediately enters drag state. Used after
   * picking up the map avatar — the user's pointer is already held down there.
   */
  pickupFrom?: { x: number; y: number };
  /** Fires when released off the map while in pickupFrom mode (no snap-back needed) */
  onDropCancel?: () => void;
};

const BubbleHome: React.FC<Props> = ({ mapRef, onDrop, onDraggingChange, onNearHomeChange, pickupFrom, onDropCancel }) => {
  const bubbleRef     = useRef<HTMLDivElement>(null);
  const dragControls  = useDragControls();
  const firedPickupRef = useRef(false);

  const handleDrop = useCallback(
    (lat: number, lng: number) => onDrop?.(lat, lng),
    [onDrop],
  );

  const { isDragging, dragPos, handleDragStart, handleDrag, handleDragEnd } =
    useBubbleDrag(mapRef, handleDrop, onDropCancel);

  // Notify parent whenever drag state changes so it can show BubbleHomeGhost
  useEffect(() => {
    onDraggingChange?.(isDragging);
  }, [isDragging, onDraggingChange]);

  // Detect when drag enters/leaves the home snap zone and notify parent
  useHomeProximity(isDragging, dragPos, onNearHomeChange);

  // When mounted at a pickup position, programmatically start the Framer Motion
  // drag using the real pointer coordinates. The user's pointer is still held
  // down at pickupFrom, so dragControls.start() picks up the live gesture.
  useEffect(() => {
    if (!pickupFrom || firedPickupRef.current) return;
    firedPickupRef.current = true;
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

  // Override CSS positioning when mounted at a pickup location.
  // The 32 px offset centres the 64 px circle on the pointer.
  const pickupStyle = pickupFrom
    ? { bottom: 'auto' as const, left: pickupFrom.x - 32, top: pickupFrom.y - 32, marginLeft: 0 }
    : undefined;

  const { gaze, isBlinking } = useEyeGaze(bubbleRef);

  // scaleY: wide-eyed while dragging → squish closed while blinking → normal
  const eyeScaleY = isDragging ? 1.4 : isBlinking ? 0.08 : 1;

  return (
    <>
      {/* ── Floating bubble ─────────────────────────────────────────────── */}
      <motion.div
        ref={bubbleRef}
        className={`bubble-btn${isDragging ? ' is-dragging' : ''}`}
        style={pickupStyle}
        drag
        dragControls={dragControls}
        dragSnapToOrigin={!pickupFrom}
        dragElastic={0.12}
        dragMomentum={false}
        dragTransition={{ bounceStiffness: 320, bounceDamping: 28 }}
        whileTap={{ scale: 0.88 }}
        whileDrag={{ scale: 1.18, boxShadow: '0 10px 36px rgba(0,0,0,0.22), 0 3px 10px rgba(0,0,0,0.12)' }}
        onDragStart={handleDragStart}
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
                className="bubble-eye"
                animate={{ x: gaze.x, y: gaze.y, scaleY: eyeScaleY }}
                transition={{
                  x:      { type: 'spring', stiffness: 200, damping: 20 },
                  y:      { type: 'spring', stiffness: 200, damping: 20 },
                  scaleY: { duration: 0.13 },
                }}
              />

              {/* Right eye — 40 ms stagger on blink close only */}
              <motion.div
                className="bubble-eye"
                animate={{ x: gaze.x, y: gaze.y, scaleY: eyeScaleY }}
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
      {isDragging && dragPos && (
        <div
          className="bubble-btn-drop-ring"
          style={{ left: dragPos.x, top: dragPos.y }}
        />
      )}
    </>
  );
};

export default BubbleHome;
