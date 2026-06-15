import Typography from '@mui/material/Typography';
import useRestaurantPanelSnap from './useRestaurantPanelSnap';
import './RestaurantInfoPanel.css';

type Props = {
  desktopTopOffsetPx?: number;
};

const RestaurantInfoPanel: React.FC<Props> = ({ desktopTopOffsetPx = 0 }) => {
  const {
    handleHandlePointerDown,
    isDragging,
    isMobile,
    panelHeight,
    translateY,
  } = useRestaurantPanelSnap();

  const content = (
    <div className="restaurant-panel-scroll-content restaurant-panel-results-empty">
      <Typography variant="body2" color="text.secondary">
        Pull up the panel and drop the avatar to load nearby restaurants.
      </Typography>
    </div>
  );

  if (!isMobile) {
    return (
      <aside
        className="restaurant-panel-desktop"
        style={{ top: desktopTopOffsetPx }}
        aria-label="Area restaurants panel"
      >
        <div className="restaurant-panel-header-desktop">Restaurants in this area</div>
        <div className="restaurant-panel-content">
          {content}
        </div>
      </aside>
    );
  }

  return (
    <section
      className="restaurant-sheet-mobile"
      style={{
        height: panelHeight,
        transform: `translateY(${translateY}px)`,
        transition: isDragging ? 'none' : 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}
      aria-label="Area restaurants panel"
    >
      <div
        className="restaurant-sheet-header"
        onPointerDown={handleHandlePointerDown}
      >
        <div className="restaurant-sheet-handle-wrap">
          <div className="restaurant-sheet-handle" />
        </div>
        <div className="restaurant-sheet-title">Restaurants in this area</div>
      </div>
      <div className="restaurant-panel-content">
        {content}
      </div>
    </section>
  );
};

export default RestaurantInfoPanel;
