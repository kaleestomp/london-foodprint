import type { FC } from 'react';

import { useRestaurantPanelSnapState } from './RestaurantPanelSnapContext';
import RestaurantList from './RestaurantList';
import BottomToolbar from './BottomToolbar';

import './RestaurantInfoPanel.css';

type Props = {
  desktopTopOffsetPx?: number;
};

const RestaurantInfoPanel: FC<Props> = ({ desktopTopOffsetPx = 0 }) => {
  const {
    handlePanelPointerDown,
    handleHandlePointerDown,
    handleContentPointerDown,
    handleContentPointerMove,
    handleContentPointerUp,
    handleContentPointerCancel,
    isDragging,
    isMobile,
    isPanelOpen,
    panelHeight,
    translateY,
  } = useRestaurantPanelSnapState();

  if (!isMobile) {
    return (
      <>
        <aside
          className="restaurant-panel-desktop"
          style={{ top: desktopTopOffsetPx }}
          aria-label="Area restaurants panel"
        >
          <div className="restaurant-panel-header-desktop">Restaurants in this area</div>
          <div className="restaurant-panel-content">
            <RestaurantList
              isPanelOpen
              allowScroll
              onContentPointerDown={handleContentPointerDown}
              onContentPointerMove={handleContentPointerMove}
              onContentPointerUp={handleContentPointerUp}
              onContentPointerCancel={handleContentPointerCancel}
            />
          </div>
        </aside>
        <BottomToolbar isMobile={isMobile} panelHeight={panelHeight} translateY={translateY} />
      </>
    );
  }

  return (
    <>
      <section
        className="restaurant-sheet-mobile"
        style={{
          height: panelHeight,
          transform: `translateY(${translateY}px)`,
          transition: isDragging ? 'none' : 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        aria-label="Area restaurants panel"
        onPointerDownCapture={handlePanelPointerDown}
      >
        <div
          className="restaurant-sheet-header"
          onPointerDown={handleHandlePointerDown}
        >
          <div className="restaurant-sheet-handle-wrap">
            <div className="restaurant-sheet-handle" />
          </div>
          <div className="restaurant-sheet-title-row">
            <div className="restaurant-sheet-title">Restaurants in this area</div>
            <div className="restaurant-sheet-subtitle">
              {isPanelOpen ? 'Pull down from top to close' : 'Pull up to open'}
            </div>
          </div>
        </div>
        <div className="restaurant-panel-content">
          <RestaurantList
            isPanelOpen={isPanelOpen}
            allowScroll={isPanelOpen}
            onContentPointerDown={handleContentPointerDown}
            onContentPointerMove={handleContentPointerMove}
            onContentPointerUp={handleContentPointerUp}
            onContentPointerCancel={handleContentPointerCancel}
          />
        </div>
      </section>
      <BottomToolbar isMobile={isMobile} panelHeight={panelHeight} translateY={translateY} />
    </>
  );
};

export default RestaurantInfoPanel;
