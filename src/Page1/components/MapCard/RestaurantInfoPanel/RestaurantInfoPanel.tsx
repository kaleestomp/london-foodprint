import { motion } from 'framer-motion';
import useRestaurantPanelSnap from './useRestaurantPanelSnap';
import './RestaurantInfoPanel.css';

const RestaurantInfoPanel: React.FC = () => {
  const {
    controls,
    dragConstraints,
    handleDragEnd,
    isMobile,
    panelHeight,
    transition,
    y,
  } = useRestaurantPanelSnap();

  if (!isMobile) {
    return (
      <aside className="restaurant-panel-desktop" aria-label="Area restaurants panel">
        <div className="restaurant-panel-header-desktop">Restaurants in this area</div>
        <div className="restaurant-panel-content" />
      </aside>
    );
  } else return (
    <motion.section
      className="restaurant-sheet-mobile"
      style={{ y, height: panelHeight }}
      drag="y"
      dragMomentum
      dragElastic={0.04}
      dragConstraints={dragConstraints}
      onDragEnd={handleDragEnd}
      animate={controls}
      initial={false}
      transition={transition}
      aria-label="Area restaurants panel"
    >
      <div className="restaurant-sheet-handle-wrap">
        <div className="restaurant-sheet-handle" />
      </div>
      <div className="restaurant-sheet-title">Restaurants in this area</div>
      <div className="restaurant-panel-content" />
    </motion.section>
  );
};

export default RestaurantInfoPanel;
