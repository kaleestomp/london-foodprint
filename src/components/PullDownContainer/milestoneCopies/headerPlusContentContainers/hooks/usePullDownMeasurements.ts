import { useEffect, useRef, useState, type ReactNode } from 'react';

type UsePullDownMeasurementsParams = {
  children: ReactNode;
  isOpen: boolean;
  mobileBottomGapPx: number;
  onDesktopHeightChange?: (heightPx: number) => void;
};

const MOBILE_BREAKPOINT = 960;

const usePullDownMeasurements = ({
  children,
  isOpen,
  mobileBottomGapPx,
  onDesktopHeightChange,
}: UsePullDownMeasurementsParams) => {
  const containerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const contentInnerRef = useRef<HTMLDivElement | null>(null);

  const [contentHeight, setContentHeight] = useState(0);
  const [maxContentHeight, setMaxContentHeight] = useState(0);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches || window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
  });

  const expandedContentHeight = Math.max(0, Math.min(contentHeight, maxContentHeight));

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
    const contentElement = contentRef.current;
    if (!contentElement) return;

    const measureLayout = () => {
      const resolvedMaxHeight = Number.parseFloat(window.getComputedStyle(contentElement).maxHeight);
      setMaxContentHeight(Number.isFinite(resolvedMaxHeight) ? resolvedMaxHeight : 0);
    };

    measureLayout();

    const observer = new ResizeObserver(measureLayout);
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
    const innerElement = contentInnerRef.current;
    if (!contentElement || !innerElement) return;

    const measure = () => {
      const styles = window.getComputedStyle(contentElement);
      const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
      const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
      const intrinsicHeight = innerElement.getBoundingClientRect().height;
      setContentHeight(Math.ceil(intrinsicHeight + paddingTop + paddingBottom));
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(contentElement);
    observer.observe(innerElement);

    return () => observer.disconnect();
  }, [children, isOpen]);

  useEffect(() => {
    if (!onDesktopHeightChange) return;

    const element = containerRef.current;
    if (!element || isMobile) {
      onDesktopHeightChange(0);
      return;
    }

    const publishHeight = () => {
      onDesktopHeightChange(Math.ceil(element.getBoundingClientRect().height));
    };

    publishHeight();

    const observer = new ResizeObserver(publishHeight);
    observer.observe(element);

    return () => observer.disconnect();
  }, [isMobile, onDesktopHeightChange]);

  return {
    containerRef,
    contentRef,
    contentInnerRef,
    expandedContentHeight,
  };
};

export default usePullDownMeasurements;