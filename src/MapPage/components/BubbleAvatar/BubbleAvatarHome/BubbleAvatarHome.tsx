import { memo, useEffect, useRef } from 'react';
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
  const { dragEnabled, flightOffset, opacity, transitionCss, handleAnimationComplete } = useBubbleFlightAnimation({
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
  const dropRingRef = useRef<HTMLDivElement>(null);
  const isPickupPending = !!pickupPos && !isDragging;

  // Provide a raw pointer drag path for all pointers.
  const { startRawDrag } = useRawPointerDrag( 
    dragEnabled, isDragging, 
    onDrag.handleDragStartAtPoint, 
    onDrag.handleDragMoveToPoint, 
    onDrag.handleDragEndAtPoint,
  );

  // Bootstrap pickup-mode drag and resolve pointer-up fallback if drag never starts.
  usePickupBootstrap(
    pickupPos,
    onDrag.resetDragStarted, onDrag.hasDragStarted,
    startRawDrag, resolveDrop,
  );

  const isCoarsePointer = useCoarsePointer();

  useEffect(() => {
    if (!dropRingRef.current) return;

    const ring = dropRingRef.current;
    const applyPosition = () => {
      ring.style.left = `${onDrag.dragMotion.pointer.x.get()}px`;
      ring.style.top = `${onDrag.dragMotion.pointer.y.get()}px`;
    };

    applyPosition();
    const unsubscribeX = onDrag.dragMotion.pointer.x.subscribe(applyPosition);
    const unsubscribeY = onDrag.dragMotion.pointer.y.subscribe(applyPosition);
    return () => {
      unsubscribeX();
      unsubscribeY();
    };
  }, [onDrag.dragMotion.pointer.x, onDrag.dragMotion.pointer.y, isDragging, isNearHome]);

  // Compute the bubble style based on drag/pickup state
  const style = pickupPos
    ? 'pickup' : isMobile
    ? 'mobile-home'
    : undefined;
  const bubbleStyle = useBubbleStyle({ style, homeCenter, pickupPos });
  const rawOffsetX = onDrag.dragMotion.rawOffset.x.get();
  const rawOffsetY = onDrag.dragMotion.rawOffset.y.get();
  const totalX = flightOffset.x + rawOffsetX;
  const totalY = flightOffset.y + rawOffsetY;
  const dragLiftScale = isDragging ? (isCoarsePointer ? 1.03 : 1.18) : 1;
  const dragShadow = isDragging
    ? (isCoarsePointer
      ? '0 2px 8px rgba(0,0,0,0.14)'
      : '0 10px 36px rgba(0,0,0,0.22), 0 3px 10px rgba(0,0,0,0.12)')
    : undefined;

  useEffect(() => {
    if (!bubbleRef.current) return;

    const bubble = bubbleRef.current;
    const applyTransform = () => {
      const rawOffsetX = onDrag.dragMotion.rawOffset.x.get();
      const rawOffsetY = onDrag.dragMotion.rawOffset.y.get();
      const totalX = flightOffset.x + rawOffsetX;
      const totalY = flightOffset.y + rawOffsetY;
      bubble.style.transform = `translate3d(${totalX}px, ${totalY}px, 0) scale(${dragLiftScale})`;
    };

    applyTransform();
    const unsubscribeX = onDrag.dragMotion.rawOffset.x.subscribe(applyTransform);
    const unsubscribeY = onDrag.dragMotion.rawOffset.y.subscribe(applyTransform);
    return () => {
      unsubscribeX();
      unsubscribeY();
    };
  }, [
    dragLiftScale,
    flightOffset.x,
    flightOffset.y,
    onDrag.dragMotion.rawOffset.x,
    onDrag.dragMotion.rawOffset.y,
  ]);

  const composedStyle: React.CSSProperties = {
    ...(bubbleStyle ?? {}),
    opacity,
    transform: `translate3d(${totalX}px, ${totalY}px, 0) scale(${dragLiftScale})`,
    transition: isDragging ? 'none' : transitionCss,
    boxShadow: dragShadow,
  };

  const { count: dragRestaurantCount, isLoading: isDragCountLoading } = useDragRestaurantCount({
    mapRef,
    pointer: onDrag.dragMotion.pointer,
    isActive: isDragging && !isNearHome,
  });

  return (
    <>
      <div
        ref={bubbleRef}
        className={`bubble-btn${isDragging ? ' is-dragging' : ''}`}
        style={composedStyle}
        onTransitionEnd={handleAnimationComplete}
        onPointerDown={dragEnabled ? (event) => {
          event.preventDefault();
          event.stopPropagation();
          startRawDrag(event.clientX, event.clientY, event.pointerId);
        } : undefined}
        role="button"
        aria-label="Drag to explore an area"
      >
        <BubbleEyes bubbleRef={bubbleRef} pickupPos={pickupPos} isDragging={isDragging} />
      </div>

      {/* ── Drop-ring overlay (follows pointer while dragging) ───────────── */}
      {isDragging && !isNearHome && (
        <div
          ref={dropRingRef}
          className="bubble-btn-drop-ring-shell"
        >
          <DashedCircle className="bubble-btn-drop-ring" />
          <Badge count={dragRestaurantCount} isLoading={isDragCountLoading} />
        </div>
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
