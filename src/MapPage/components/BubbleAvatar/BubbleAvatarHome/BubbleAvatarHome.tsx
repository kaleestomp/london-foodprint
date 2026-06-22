import { useCallback, useMemo, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import useBubbleDrag from '../useDragAndDrop/useBubbleDrag';
import useHomeProximity from './hooks/useHomeProximity';
import useBubbleFlightAnimation from './hooks/useBubbleFlightAnimation';
import useResolvePickupWithoutDrag from './hooks/useResolvePickupWithoutDrag';
import useIsDropOnRestaurantPanel from './hooks/useIsDropOnRestaurantPanel';
import usePickupBootstrap from './hooks/usePickupBootstrap';
import useCoarsePointer from './hooks/useCoarsePointer';
import useRawPointerDrag from './hooks/useRawPointerDrag';
import useBubbleStyle from './hooks/useBubbleStyle';
import { useBubbleAvatarState } from '../BubbleAvatarStateContext';
import { useRestaurantPanelSnapState } from '../../RestaurantInfoPanel/RestaurantPanelSnapContext';
import { getHomeCenter } from '../config';
import DashedCircle from '../Searchmask/DashedCircle';
import BubbleEyes from '../BubbleEyes/BubbleEyes';
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
  // Get Fly Animation State from Prop
  const { flyInFrom, flyOutTo, onFlyOutComplete } = flight ?? {};
  // Get Bubble State from Context
  const {
    pickupPos,
    isDragging,
    isNearHome,
    setIsNearHome,
    handleDrop,
    handleDropCancel,
  } = useBubbleAvatarState();
  const { isMobile, translateY, panelHeight } = useRestaurantPanelSnapState();
  const homeCenter = useMemo(
    () => getHomeCenter(isMobile ? translateY : undefined),
    [isMobile, translateY],
  );
  const isDropOnRestaurantPanel = useIsDropOnRestaurantPanel({
    isMobile,
    translateY,
    panelHeight,
  });

  // Resolves pickup mode when pointer is released before drag starts. Prevents a "hovering" avatar
  const resolvePickupWithoutDrag = useResolvePickupWithoutDrag(
    mapRef,
    handleDrop,
    handleDropCancel,
    homeCenter,
    isDropOnRestaurantPanel,
  );

  // Get Flight Animation Controls
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
    homeCenter,
  });

  // Get Drag Controls
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
  } = useBubbleDrag(
    mapRef,
    dragDropCallback,
    homeCenter,
    handleDropCancel,
    isDropOnRestaurantPanel,
  );

  // Detect when drag enters/leaves the home snap zone and UPDATE CONTEXT.
  useHomeProximity(isDragging, dragPos, homeCenter, setIsNearHome);

  const bubbleRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const isPickupPending = !!pickupPos && !isDragging;


  // Detect input capability so drag UX can adapt for touch/coarse pointers.
  const isCoarsePointer = useCoarsePointer();
  const rawDragEnabled = isCoarsePointer && dragEnabled;
  // Provide a raw pointer drag path used on coarse pointers instead of Framer drag events.
  const { startRawDrag } = useRawPointerDrag(
    rawDragEnabled,
    isDragging,
    handleDragStartAtPoint,
    handleDragMoveToPoint,
    handleDragEndAtPoint,
  );

  // Bootstrap pickup-mode drag and resolve pointer-up fallback if drag never starts.
  usePickupBootstrap(
    pickupPos,
    rawDragEnabled,
    dragControls,
    resetDragStarted,
    startRawDrag,
    hasDragStarted,
    resolvePickupWithoutDrag,
  );

  // Compute the bubble style based on drag/pickup state
  const style = rawDragEnabled && isDragging && dragPos
    ? 'raw-drag' : pickupPos
    ? 'pickup' : isMobile
    ? 'mobile-home'
    : undefined;
  const bubbleStyle = useBubbleStyle({ style, homeCenter, pickupPos, dragPos });

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
        <BubbleEyes bubbleRef={bubbleRef} pickupPos={pickupPos} isDragging={isDragging} />
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
