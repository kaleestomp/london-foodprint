import { useCallback, useEffect, useRef, useState } from 'react';

type Params = {
  transitionMs: number;
};

type Result = {
  isExpanded: boolean;
  // isCollapsing: boolean;
  showExpandedLayout: boolean;
  reopenLayout: () => void;
  startCollapseAnimation: () => void;
  clearCollapseTimer: () => void;
};

const useCollapseTransition = ({ transitionMs }: Params): Result => {
  
  const collapseTimerRef = useRef<number | null>(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);

  const showExpandedLayout = isExpanded || isCollapsing;

  const clearCollapseTimer = useCallback(() => {
    if (collapseTimerRef.current !== null) {
      window.clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
  }, []);

  const startCollapseAnimation = useCallback(() => {
    clearCollapseTimer();
    setIsExpanded(false);
    setIsCollapsing(true);
    collapseTimerRef.current = window.setTimeout(() => {
      setIsCollapsing(false);
      collapseTimerRef.current = null;
    }, transitionMs);
  }, [clearCollapseTimer, transitionMs]);

  const reopenLayout = useCallback(() => {
    clearCollapseTimer();
    setIsCollapsing(false);
    setIsExpanded(true);
  }, [clearCollapseTimer]);

  useEffect(() => {
    return () => {
      clearCollapseTimer();
    };
  }, [clearCollapseTimer]);

  return {
    isExpanded,
    // isCollapsing,
    showExpandedLayout,
    reopenLayout,
    startCollapseAnimation,
    clearCollapseTimer,
  };
};

export default useCollapseTransition;
