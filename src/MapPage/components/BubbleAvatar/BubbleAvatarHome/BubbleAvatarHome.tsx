import { memo, useMemo, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import type maplibregl from 'maplibre-gl';

import { useIsMobileCtx } from '../../../../context/IsMobileContext';
import { useBubbleAvatarState } from '../BubbleAvatarStateContext';
import onBubbleDrag from '../onBubbleDrag/onBubbleDrag';
import useHomeProximity from './hooks/useHomeProximity';
import useBubbleFlightAnimation from './hooks/useBubbleFlightAnimation';
import useResolveDrop from './hooks/useResolveDrop';
// import useIsDropOnPullUpPanel from './hooks/useIsDropOnPullUpPanel';
import usePickupBootstrap from './hooks/usePickupBootstrap';
import useCoarsePointer from './hooks/useCoarsePointer';
import useRawPointerDrag from './hooks/useRawPointerDrag';
import useBubbleStyle from './hooks/useBubbleStyle';
import useHomeCenter from './hooks/useHomeCenter';
import DashedCircle from '../Searchmask/DashedCircle';
import Badge from '../Badge/Badge';
import useDragRestaurantCount from '../Badge/useDragRestaurantCount';
import BubbleEyes from '../BubbleEyes/BubbleEyes';
import './BubbleAvatarHome.css';

type Props = {
  mapRef: React.RefObject<maplibregl.Map | null>;
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

  const isMobile = useIsMobileCtx();  
  const { pickupPos, isDragging, isNearHome } = useBubbleAvatarState();

  // FIND HOME CENTER
  const homeCenter = useHomeCenter();

  // FLIGHT CONTROL
  const { flyInFrom, flyOutTo, onFlyOutComplete } = flight ?? {};
  const { initial, animate, transition, dragEnabled, handleAnimationComplete } = useBubbleFlightAnimation({
    pickupFrom: pickupPos ?? undefined,
    flyInFrom, flyOutTo,
    onFlyOutComplete,
    homeCenter,
  });

  // MASTER DROP EVENTS HANDLER
  const resolveDrop = useResolveDrop(mapRef, homeCenter);
  // MASTER DRAG HANDLERS
  const onDrag = onBubbleDrag( mapRef, resolveDrop );

  // DETECT NEAR-HOME
  // Detect when drag enters/leaves the home snap zone and UPDATE CONTEXT.
  useHomeProximity( onDrag.dragMotion.pointer, homeCenter );

  const bubbleRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const isPickupPending = !!pickupPos && !isDragging;

  // Detect input capability so drag UX can adapt for touch/coarse pointers.
  const isCoarsePointer = useCoarsePointer();
  const rawDragEnabled = isCoarsePointer && dragEnabled;
  // Provide a raw pointer drag path used on coarse pointers instead of Framer drag events.
  const { startRawDrag } = useRawPointerDrag( 
    rawDragEnabled, isDragging, 
    onDrag.handleDragStartAtPoint, 
    onDrag.handleDragMoveToPoint, 
    onDrag.handleDragEndAtPoint,
  );

  // Bootstrap pickup-mode drag and resolve pointer-up fallback if drag never starts.
  usePickupBootstrap(
    pickupPos, rawDragEnabled, dragControls,
    onDrag.resetDragStarted, onDrag.hasDragStarted,
    startRawDrag, resolveDrop,
  );

  // Compute the bubble style based on drag/pickup state
  const style = pickupPos
    ? 'pickup' : isMobile
    ? 'mobile-home'
    : undefined;
  const bubbleStyle = useBubbleStyle({ style, homeCenter, pickupPos });
  const motionStyle = rawDragEnabled
    ? { ...(bubbleStyle ?? {}), x: onDrag.dragMotion.rawOffset.x, y: onDrag.dragMotion.rawOffset.y }
    : bubbleStyle;

  const whileDragVisual = useMemo(
    () => (isCoarsePointer
      ? { scale: 1.03, boxShadow: '0 2px 8px rgba(0,0,0,0.14)' }
      : { scale: 1.18, boxShadow: '0 10px 36px rgba(0,0,0,0.22), 0 3px 10px rgba(0,0,0,0.12)' }),
    [isCoarsePointer],
  );

  const { count: dragRestaurantCount, isLoading: isDragCountLoading } = useDragRestaurantCount({
    mapRef,
    pointer: onDrag.dragMotion.pointer,
    isActive: isDragging && !isNearHome,
  });

  return (
    <>
      {/* ── Floating bubble ─────────────────────────────────────────────── */}
      <motion.div
        ref={bubbleRef}
        className={`bubble-btn${isDragging ? ' is-dragging' : ''}`}
        style={motionStyle}
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
        onDragStart={rawDragEnabled ? undefined : onDrag.handleDragStart}
        onDrag={rawDragEnabled ? undefined : onDrag.handleDrag}
        onDragEnd={rawDragEnabled ? undefined : onDrag.handleDragEnd}
        onPointerDown={rawDragEnabled ? (event) => {
          event.preventDefault();
          event.stopPropagation();
          startRawDrag(event.clientX, event.clientY, event.pointerId);
        } : undefined}
        role="button"
        aria-label="Drag to explore an area"
      >
        <BubbleEyes bubbleRef={bubbleRef} pickupPos={pickupPos} isDragging={isDragging} />
      </motion.div>

      {/* ── Drop-ring overlay (follows pointer while dragging) ───────────── */}
      {isDragging && !isNearHome && (
        <motion.div
          className="bubble-btn-drop-ring-shell"
          style={{ left: onDrag.dragMotion.pointer.x, top: onDrag.dragMotion.pointer.y }}
        >
          <DashedCircle className="bubble-btn-drop-ring" />
          <Badge count={dragRestaurantCount} isLoading={isDragCountLoading} />
        </motion.div>
      )}

      {isPickupPending && pickupPos && (
        <div className="bubble-btn-drop-ring-shell" style={{ left: pickupPos.x, top: pickupPos.y }}>
          <DashedCircle className="bubble-btn-drop-ring" />
        </div>
      )}
    </>
  );
};

export default memo(BubbleHome);
