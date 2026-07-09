import { useEffect, useRef, useState, type ReactNode } from 'react';

type UsePullDownMeasurementsParams = {
  children: ReactNode;
  isOpen: boolean;
  onDesktopHeightChange?: (heightPx: number) => void;
};

const usePullDownMeasurements = ({
  children,
  isOpen,
  onDesktopHeightChange,
}: UsePullDownMeasurementsParams) => {
  const DESKTOP_BREAKPOINT_PX = 960;

  const containerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const contentInnerRef = useRef<HTMLDivElement | null>(null);

  const [contentHeight, setContentHeight] = useState(0);
  const [maxContentHeight, setMaxContentHeight] = useState(0);

  const expandedContentHeight = Math.max(0, Math.min(contentHeight, maxContentHeight));

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
  }, []);

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
    if (!element) {
      onDesktopHeightChange(0);
      return;
    }

    const publishTargetHeight = () => {
      const isDesktop = window.innerWidth >= DESKTOP_BREAKPOINT_PX;
      if (!isDesktop) {
        onDesktopHeightChange(0);
        return;
      }

      const targetHeight = Math.ceil(isOpen ? expandedContentHeight : 0);
      onDesktopHeightChange(targetHeight);
    };

    publishTargetHeight();

    window.addEventListener('resize', publishTargetHeight);
    window.visualViewport?.addEventListener('resize', publishTargetHeight);

    return () => {
      window.removeEventListener('resize', publishTargetHeight);
      window.visualViewport?.removeEventListener('resize', publishTargetHeight);
    };
  }, [expandedContentHeight, isOpen, onDesktopHeightChange]);


  return {
    containerRef,
    contentRef,
    contentInnerRef,
    expandedContentHeight,
  };
};

export default usePullDownMeasurements;