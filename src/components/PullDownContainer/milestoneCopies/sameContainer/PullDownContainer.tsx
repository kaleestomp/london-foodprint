import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useAnimationControls, useDragControls, type PanInfo } from 'framer-motion';
import './PullDownContainer.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  mobileBottomGapPx?: number;
  onDesktopHeightChange?: (heightPx: number) => void;
};

const MOBILE_BREAKPOINT = 960;
const CLOSE_THRESHOLD_PX = 56;

const springTransition = {
  type: 'spring' as const,
  stiffness: 340,
  damping: 32,
  mass: 0.9,
};

const PullDownContainer: React.FC<Props> = ({
  isOpen,
  onClose,
  children,
  mobileBottomGapPx = 72,
  onDesktopHeightChange,
}) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const contentMeasureRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [maxContentHeight, setMaxContentHeight] = useState(0);
  const [collapsedHeaderHeight, setCollapsedHeaderHeight] = useState(0);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches || window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
  });

  const controls = useAnimationControls();
  const dragControls = useDragControls();

  const expandedContentHeight = Math.max(0, Math.min(contentHeight, maxContentHeight));
  const totalHeight = collapsedHeaderHeight + expandedContentHeight;
  const hiddenTravel = expandedContentHeight;

  useEffect(() => {
    const coarsePointerMedia = window.matchMedia('(pointer: coarse)');
    const mobileWidthMedia = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const updateIsMobile = () => {
      setIsMobile(coarsePointerMedia.matches || mobileWidthMedia.matches);
    };

    updateIsMobile();
    coarsePointerMedia.addEventListener('change', updateIsMobile);
    mobileWidthMedia.addEventListener('change', updateIsMobile);

    return () => {
      coarsePointerMedia.removeEventListener('change', updateIsMobile);
      mobileWidthMedia.removeEventListener('change', updateIsMobile);
    };
  }, []);

  useEffect(() => {
    const headerElement = headerRef.current;
    const contentElement = contentRef.current;
    if (!headerElement || !contentElement) return;

    const measureLayout = () => {
      setCollapsedHeaderHeight(headerElement.getBoundingClientRect().height);
      const resolvedMaxHeight = Number.parseFloat(window.getComputedStyle(contentElement).maxHeight);
      setMaxContentHeight(Number.isFinite(resolvedMaxHeight) ? resolvedMaxHeight : 0);
    };

    measureLayout();

    const observer = new ResizeObserver(measureLayout);
    observer.observe(headerElement);
    observer.observe(contentElement);

    window.addEventListener('resize', measureLayout);
    window.visualViewport?.addEventListener('resize', measureLayout);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measureLayout);
      window.visualViewport?.removeEventListener('resize', measureLayout);
    };
  }, [isMobile, mobileBottomGapPx]);

  useEffect(() => {
    const contentElement = contentRef.current;
    const measureElement = contentMeasureRef.current;
    if (!contentElement || !measureElement) return;

    const measure = () => {
      const styles = window.getComputedStyle(contentElement);
      const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
      const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
      const intrinsicHeight = measureElement.getBoundingClientRect().height;
      setContentHeight(Math.ceil(intrinsicHeight + paddingTop + paddingBottom));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(contentElement);
    observer.observe(measureElement);

    return () => observer.disconnect();
  }, [children]);

  useEffect(() => {
    controls.start({
      y: isOpen ? 0 : -hiddenTravel,
      opacity: isOpen ? 1 : 0.96,
      transition: springTransition,
    });
  }, [controls, hiddenTravel, isOpen]);

  useEffect(() => {
    if (!onDesktopHeightChange) return;
    if (isMobile) {
      onDesktopHeightChange(0);
      return;
    }
    onDesktopHeightChange(collapsedHeaderHeight + (isOpen ? expandedContentHeight : 0));
  }, [collapsedHeaderHeight, expandedContentHeight, isMobile, isOpen, onDesktopHeightChange]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isOpen) return;
    if (info.offset.y < -CLOSE_THRESHOLD_PX || info.velocity.y < -500) {
      onClose();
      return;
    }
    controls.start({ y: 0, transition: springTransition });
  };

  return (
    <motion.section
      className={`pull-down-container ${isMobile ? 'pull-down-mobile' : 'pull-down-desktop'} ${isOpen ? 'is-open' : 'is-closed'}`}
      style={{
        height: totalHeight,
        ['--pull-down-bottom-gap' as string]: `${mobileBottomGapPx}px`,
      }}
      animate={controls}
      initial={false}
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0.06}
      dragConstraints={{ top: -hiddenTravel, bottom: 0 }}
      onDragEnd={handleDragEnd}
      aria-hidden={!isOpen}
    >
      <div className="pull-down-container-toolbar-backdrop" aria-hidden="true" ref={headerRef} />
      <div
        className="pull-down-container-content"
        ref={contentRef}
        style={{ height: isOpen ? expandedContentHeight : 0 }}
      >
        <div className="pull-down-container-content-measure" ref={contentMeasureRef}>
          {children}
        </div>
      </div>
      {isOpen ? (
        <div
          className="pull-down-container-handle-zone"
          onPointerDown={(event) => {
            dragControls.start(event);
          }}
        >
          <div className="pull-down-container-handle" />
        </div>
      ) : null}
    </motion.section>
  );
};

export default PullDownContainer;
