import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useAnimationControls,
  useDragControls,
  type PanInfo,
} from 'framer-motion';

type UsePullDownAnimationsParams = {
  isOpen: boolean;
  expandedContentHeight: number;
  onClose: () => void;
};

const CLOSE_THRESHOLD_PX = 56;

export const pullDownSpringTransition = {
  type: 'spring' as const,
  stiffness: 340,
  damping: 32,
  mass: 0.9,
};

const usePullDownAnimations = ({
  isOpen,
  expandedContentHeight,
  onClose,
}: UsePullDownAnimationsParams) => {
  const controls = useAnimationControls();
  const dragControls = useDragControls();

  const [isContentAnimating, setIsContentAnimating] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const previousExpandedHeightRef = useRef(0);
  const previousIsOpenRef = useRef(isOpen);
  const pendingOpenFlyInRef = useRef(false);

  const isPanelRendered = isContentVisible || isClosing;
  const flyOffset = Math.min(44, Math.max(18, expandedContentHeight * 0.28));

  useEffect(() => {
    // Keep content mounted long enough to animate fly-out before unmounting.
    const wasOpen = previousIsOpenRef.current;

    if (isOpen && !wasOpen) {
      setIsClosing(false);
      setIsContentVisible(true);
      pendingOpenFlyInRef.current = true;
    }

    if (!isOpen && wasOpen && isContentVisible) {
      setIsClosing(true);
      controls.start({ y: -flyOffset, opacity: 0.92, transition: pullDownSpringTransition });
    }

    previousIsOpenRef.current = isOpen;
  }, [controls, flyOffset, isContentVisible, isOpen]);

  useEffect(() => {
    if (!pendingOpenFlyInRef.current) return;
    if (!isOpen || !isContentVisible) return;
    if (expandedContentHeight <= 0) return;

    controls.set({ y: -flyOffset, opacity: 0.92 });
    controls.start({ y: 0, opacity: 1, transition: pullDownSpringTransition });
    pendingOpenFlyInRef.current = false;
  }, [controls, expandedContentHeight, flyOffset, isContentVisible, isOpen]);

  useEffect(() => {
    // When content shrinks (e.g. collapsing filter pills), add a small upward recoil
    // so the height reduction remains visually explicit.
    const previousHeight = previousExpandedHeightRef.current;
    const isShrinking = expandedContentHeight < previousHeight;

    if (isOpen && isPanelRendered && isShrinking && !isClosing) {
      const recoil = Math.min(20, Math.max(8, (previousHeight - expandedContentHeight) * 0.25));
      controls.start({
        y: -recoil,
        opacity: 1,
        transition: { duration: 0.14, ease: 'easeOut' },
      }).then(() => {
        controls.start({ y: 0, opacity: 1, transition: pullDownSpringTransition });
      });
    }

    previousExpandedHeightRef.current = expandedContentHeight;
  }, [controls, expandedContentHeight, isClosing, isOpen, isPanelRendered]);

  const handleShellAnimationStart = useCallback(() => {
    setIsContentAnimating(true);
  }, []);

  const handleShellAnimationComplete = useCallback(() => {
    setIsContentAnimating(false);
    if (!isOpen) {
      setIsContentVisible(false);
      setIsClosing(false);
      pendingOpenFlyInRef.current = false;
      controls.set({ y: 0, opacity: 1 });
    }
  }, [controls, isOpen]);

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isOpen) return;
    if (info.offset.y < -CLOSE_THRESHOLD_PX || info.velocity.y < -500) {
      onClose();
      return;
    }
    controls.start({ y: 0, transition: pullDownSpringTransition });
  }, [controls, isOpen, onClose]);

  return {
    controls,
    dragControls,
    handleDragEnd,
    handleShellAnimationComplete,
    handleShellAnimationStart,
    isContentAnimating,
    isPanelRendered,
  };
};

export default usePullDownAnimations;