import { useState } from 'react';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useAppUI } from '../../../../context/AppUIContext';
import './LayersButton.css';

const LayersButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { mapMode, heatmapEnabled, toggleHeatmapEnabled, toggleMapMode } = useAppUI();
  
  return (
    <div className={`map-toolbar-layers-stack ${isOpen ? 'map-toolbar-layers-stack-open' : ''}`}>
      <div className="map-toolbar-layers-flyout" aria-hidden={!isOpen}>
        <button
          type="button"
          className={`map-toolbar-layers-btn ${heatmapEnabled ? 'map-toolbar-layers-btn-active' : ''}`}
          aria-label={heatmapEnabled ? 'Disable heatmap' : 'Enable heatmap'}
          aria-pressed={heatmapEnabled}
          title={heatmapEnabled ? 'Disable heatmap' : 'Enable heatmap'}
          onClick={() => {
            toggleHeatmapEnabled();
          }}
        >
          <BubbleChartIcon fontSize="small" />
        </button>
        <button
          type="button"
          className={`map-toolbar-layers-btn`} //${mapMode === 'dark' ? 'map-toolbar-layers-btn-active' : ''}
          aria-label={mapMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-pressed={mapMode === 'dark'}
          title={mapMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => {
            // toggleColorMode();
            toggleMapMode();
          }}
        >
          {mapMode === 'dark' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
        </button>
      </div>

      <button
        type="button"
        className={`map-toolbar-layers-btn ${isOpen ? 'map-toolbar-layers-btn-open' : ''}`}
        aria-label="Map layers"
        aria-expanded={isOpen}
        title="Map layers"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <LayersOutlinedIcon fontSize="small" />
      </button>
    </div>
  );
};

export default LayersButton;
