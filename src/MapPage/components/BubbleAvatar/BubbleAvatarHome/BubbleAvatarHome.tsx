import { useCallback, useMemo, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import onBubbleDrag from '../onBubbleDrag/onBubbleDrag';
import useHomeProximity from './hooks/useHomeProximity';
import useBubbleFlightAnimation from './hooks/useBubbleFlightAnimation';
import useResolvePickupWithoutDrag from './hooks/useResolvePickupWithoutDrag';
import useIsDropOnPullUpPanel from './hooks/useIsDropOnPullUpPanel';
import usePickupBootstrap from './hooks/usePickupBootstrap';
import useCoarsePointer from './hooks/useCoarsePointer';
import useRawPointerDrag from './hooks/useRawPointerDrag';
import useBubbleStyle from './hooks/useBubbleStyle';
import { useBubbleAvatarState } from '../BubbleAvatarStateContext';
import { usePullUpPanelMetrics } from '../../PullUpPanel/SnapHooks/PullUpPanelSnapContext';
import useIsMobile from '../../../../utils/browser/useIsMobile';
import { getHomeCenter } from '../config';
import DashedCircle from '../Searchmask/DashedCircle';
import Badge from '../Badge/Badge';
import useDragRestaurantCount from '../Badge/useDragRestaurantCount';
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
  const isMobile = useIsMobile();
  // Get Fly Animation State from Prop
  const { flyInFrom, flyOutTo, onFlyOutComplete } = flight ?? {};
  // Get Bubble State from Context
  const {
    pickupPos,
    isDragging,
    isNearHome,
    setNearHome,
    handleDrop,
    handleDropCancel,
  } = useBubbleAvatarState();
  const { translateY, panelHeight } = usePullUpPanelMetrics();
  const homeCenter = useMemo(
    () => getHomeCenter(isMobile ? { translateY, panelHeight } : undefined),
    [isMobile, panelHeight, translateY],
  );
  const isDropOnPullUpPanel = useIsDropOnPullUpPanel({
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
    isDropOnPullUpPanel,
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
    dragMotion,
    hasDragStarted,
    resetDragStarted,
    handleDragStart,
    handleDragStartAtPoint,
    handleDrag,
    handleDragMoveToPoint,
    handleDragEnd,
    handleDragEndAtPoint,
  } = onBubbleDrag(
    mapRef,
    dragDropCallback,
    homeCenter,
    handleDropCancel,
    isDropOnPullUpPanel,
  );

  // Detect when drag enters/leaves the home snap zone and UPDATE CONTEXT.
  useHomeProximity(isDragging, dragMotion.pointer, homeCenter, setNearHome);

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
  const style = pickupPos
    ? 'pickup' : isMobile
    ? 'mobile-home'
    : undefined;
  const bubbleStyle = useBubbleStyle({ style, homeCenter, pickupPos });
  const motionStyle = rawDragEnabled
    ? { ...(bubbleStyle ?? {}), x: dragMotion.rawOffset.x, y: dragMotion.rawOffset.y }
    : bubbleStyle;

  const whileDragVisual = useMemo(
    () => (isCoarsePointer
      ? { scale: 1.03, boxShadow: '0 2px 8px rgba(0,0,0,0.14)' }
      : { scale: 1.18, boxShadow: '0 10px 36px rgba(0,0,0,0.22), 0 3px 10px rgba(0,0,0,0.12)' }),
    [isCoarsePointer],
  );

  const { count: dragRestaurantCount, isLoading: isDragCountLoading } = useDragRestaurantCount({
    mapRef,
    pointer: dragMotion.pointer,
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
      {isDragging && !isNearHome && (
        <motion.div
          className="bubble-btn-drop-ring-shell"
          style={{ left: dragMotion.pointer.x, top: dragMotion.pointer.y }}
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

export default BubbleHome;
