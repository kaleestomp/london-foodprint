import { useCallback, useState, type ReactNode, type TransitionEvent as ReactTransitionEvent } from 'react';
import usePullDownAnimations from './hooks/usePullDownAnimations';
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
  const [isShellAnimating, setIsShellAnimating] = useState(false);

  const {
    containerRef,
    contentRef,
    contentInnerRef,
    expandedContentHeight,
  } = usePullDownMeasurements({
    children,
    isOpen,
    onDesktopHeightChange,
  });

  const {
    dragLayerStyle,
    handleHandlePointerDown,
    isClosing,
    isDragging,
    isPanelRendered,
  } = usePullDownAnimations({
    isOpen,
    expandedContentHeight,
    onClose,
  });

  const handleShellTransitionStart = useCallback((event: ReactTransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== 'height') return;
    setIsShellAnimating(true);
  }, []);

  const handleShellTransitionEnd = useCallback((event: ReactTransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== 'height') return;
    setIsShellAnimating(false);
  }, []);

  return (
    <section
      ref={containerRef}
      className={`pull-down-container ${isPanelRendered ? 'is-open' : 'is-closed'} ${isClosing ? 'is-closing' : ''} ${isShellAnimating ? 'is-shell-animating' : ''}`}
      style={{
        ['--pull-down-bottom-gap' as string]: `${mobileBottomGapPx}px`,
      }}
      aria-hidden={!isOpen}
    >
      <div
        className="pull-down-content-shell"
        style={{
          height: isOpen ? expandedContentHeight : 0,
        }}
        onTransitionStart={handleShellTransitionStart}
        onTransitionEnd={handleShellTransitionEnd}
      >
        <div
          className={`pull-down-content-drag-layer ${isDragging ? 'is-dragging' : ''}`}
          style={dragLayerStyle}
        >
          <div className="pull-down-content" ref={contentRef}>
            <div className="pull-down-content-inner" ref={contentInnerRef}>
              {children}
            </div>
          </div>
          <div className="pull-down-handle-zone" aria-hidden="true">
            <div
              className="pull-down-handle-wrap"
              onPointerDown={handleHandlePointerDown}
            >
              <div className="pull-down-handle" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PullDownContainer;
