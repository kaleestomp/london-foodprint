import { useMemo } from 'react';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import useRestaurantPanelSnap from './useRestaurantPanelSnap';
import './RestaurantInfoPanel.css';

type Props = {
  desktopTopOffsetPx?: number;
};

const RestaurantInfoPanel: React.FC<Props> = ({ desktopTopOffsetPx = 0 }) => {
  const {
    controls,
    dragControls,
    dragConstraints,
    handleDragEnd,
    isMobile,
    panelHeight,
    transition,
    y,
  } = useRestaurantPanelSnap();

  const content = useMemo(() => (
    <div className="restaurant-panel-scroll-content restaurant-panel-results-empty">
      <Typography variant="body2" color="text.secondary">
        Pull up the panel and drop the avatar to load nearby restaurants.
      </Typography>
    </div>
  ), []);

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
            {content}
          </div>
        </aside>
      </>
    );
  } else return (
    <>
      <motion.section
        className="restaurant-sheet-mobile"
        style={{ y, height: panelHeight }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragElastic={0.04}
        dragConstraints={dragConstraints}
        onDragEnd={handleDragEnd}
        animate={controls}
        initial={false}
        transition={transition}
        aria-label="Area restaurants panel"
      >
        <div
          className="restaurant-sheet-header"
          onPointerDown={(event) => dragControls.start(event)}
        >
          <div className="restaurant-sheet-handle-wrap">
          <div className="restaurant-sheet-handle" />
          </div>
          <div className="restaurant-sheet-title">Restaurants in this area</div>
        </div>
        <div className="restaurant-panel-content">
          {content}
        </div>
      </motion.section>
    </>
  );
};

export default RestaurantInfoPanel;
