import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import usePullDownAnimations, { pullDownSpringTransition } from './hooks/usePullDownAnimations';
import usePullDownMeasurements from './hooks/usePullDownMeasurements';
import './PullDownContainer.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  mobileBottomGapPx?: number;
  onDesktopHeightChange?: (heightPx: number) => void;
};

const PullDownContainer: React.FC<Props> = ({
  isOpen,
  onClose,
  children,
  mobileBottomGapPx = 72,
  onDesktopHeightChange,
}) => {
  const {
    containerRef,
    contentRef,
    contentInnerRef,
    expandedContentHeight,
  } = usePullDownMeasurements({
    children,
    isOpen,
    mobileBottomGapPx,
    onDesktopHeightChange,
  });

  const {
    controls,
    dragControls,
    handleDragEnd,
    handleShellAnimationComplete,
    handleShellAnimationStart,
    isContentAnimating,
    isPanelRendered,
  } = usePullDownAnimations({
    isOpen,
    expandedContentHeight,
    onClose,
  });

  return (
    <motion.section
      ref={containerRef}
      className={`pull-down-container ${isPanelRendered ? 'is-open' : 'is-closed'}`}
      style={{
        ['--pull-down-bottom-gap' as string]: `${mobileBottomGapPx}px`,
      }}
      initial={false}
      aria-hidden={!isOpen}
    >
      <div className="pull-down-header" aria-hidden="true" />
      <motion.div
        className="pull-down-content-shell"
        animate={{
          height: isOpen ? expandedContentHeight : 0,
          transition: pullDownSpringTransition,
        }}
        onAnimationStart={handleShellAnimationStart}
        onAnimationComplete={handleShellAnimationComplete}
      >
        <motion.div
          className="pull-down-content-drag-layer"
          animate={controls}
          initial={false}
          drag={isPanelRendered ? 'y' : false}
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          dragElastic={0.06}
          dragConstraints={{ top: -expandedContentHeight, bottom: 0 }}
          onDragEnd={handleDragEnd}
        >
          <div className={`pull-down-content ${isContentAnimating ? 'is-animating' : ''}`} ref={contentRef}>
            <div className="pull-down-content-inner" ref={contentInnerRef}>
              {children}
            </div>
          </div>
          {isPanelRendered ? (
            <div
              className="pull-down-handle-zone"
              onPointerDown={(event) => {
                dragControls.start(event);
              }}
            >
              <div className="pull-down-handle" />
            </div>
          ) : null}
        </motion.div>
      </motion.div>
    </motion.section>
  );
};

export default PullDownContainer;
