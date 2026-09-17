import { useState, type FC } from 'react';
import type * as maplibregl from 'maplibre-gl';
import Fab from '@mui/material/Fab';
import KeyboardArrowLeftRoundedIcon from '@mui/icons-material/KeyboardArrowLeftRounded';
import FormatListNumberedRoundedIcon from '@mui/icons-material/FormatListNumberedRounded';

import RestaurantList from '../RestaurantList/RestaurantList';

import './DesktopPanel.css';

const DesktopPanel: FC<{
  mapRef: React.RefObject<maplibregl.Map | null>;
}> = ({ mapRef }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      <aside className={`desktop-panel${isOpen ? '' : ' is-closed'}`} aria-label="Places">
        <div className="desktop-panel-body">
          <RestaurantList mapRef={mapRef} pageSize={20} />
        </div>
      </aside>
      <Fab
        className={`desktop-panel-toggle${isOpen ? '' : ' is-closed'}`}
        size="small"
        color="default"
        aria-label={isOpen ? 'Close places panel' : 'Open places panel'}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? <KeyboardArrowLeftRoundedIcon /> : <FormatListNumberedRoundedIcon fontSize="large" />}
      </Fab>
    </>
  );
};

export default DesktopPanel;