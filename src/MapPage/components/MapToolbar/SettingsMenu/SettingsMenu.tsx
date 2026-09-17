import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import LayersRoundedIcon from '@mui/icons-material/LayersRounded';
import SettingsIcon from '@mui/icons-material/Settings';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import StarsRoundedIcon from '@mui/icons-material/StarsRounded';

import { useAppUI } from '../../../../context/AppUIContext';
import { useCityContext, type cityOptions } from '../../../../context/CityContext';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import RatingCard from '../../FilterTabs/RatingFilter/RatingCard/RatingCard';
import '../MapToolbar.css';
import './SettingsMenu.css';

const SettingsMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { citySlug } = useCityContext();
  const {
    heatmapEnabled,
    toggleHeatmapEnabled,
    topPlacesEnabled,
  } = useAppUI();
  const { venueType, setVenueType } = useSearchFilters();

  const selectCity = (city: cityOptions) => {
    if (city !== citySlug) {
      navigate(`/${city}`);
    }
  };

  return (
    <>
      <IconButton
        className={`map-toolbar-fab${open ? ' map-toolbar-fab-active' : ''}`}
        aria-label="Open settings menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <LayersRoundedIcon fontSize="medium" />
      </IconButton>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="settings-dialog-title"
        slotProps={{
          paper: { className: 'settings-dialog-paper' },
        }}
      >
        <DialogTitle
          id="settings-dialog-title"
          className="settings-dialog-title"
          aria-label="Settings"
        >
          <SettingsIcon aria-hidden="true" />
          <IconButton
            aria-label="Close settings menu"
            onClick={() => setOpen(false)}
            edge="end"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent className="settings-dialog-content">
          <section className="settings-card-section" aria-labelledby="settings-city-heading">
            <h2 id="settings-city-heading">City</h2>
            <div className="settings-card-grid settings-city-grid">
              <RatingCard
                icon={<LocationCityIcon />}
                label="London"
                selected={citySlug === 'london'}
                onClick={() => selectCity('london')}
              />
              <RatingCard
                icon={<LocationCityIcon />}
                label="Newcastle"
                selected={citySlug === 'newcastle'}
                onClick={() => selectCity('newcastle')}
              />
            </div>
          </section>

          <section className="settings-card-section" aria-labelledby="settings-map-heading">
            <h2 id="settings-map-heading">Map</h2>
            <div className="settings-card-grid settings-map-grid">
              <RatingCard
                icon={<BubbleChartIcon />}
                label="Heatmap"
                selected={heatmapEnabled}
                onClick={toggleHeatmapEnabled}
              />
              <RatingCard
                icon={<StarsRoundedIcon />}
                label="Top 10s"
                selected={topPlacesEnabled}
                disabled
                onClick={() => {}}
              />
            </div>
          </section>

          <section className="settings-card-section" aria-labelledby="settings-venue-heading">
            <h2 id="settings-venue-heading">Venue type</h2>
            <div className="settings-card-grid settings-venue-grid">
              <RatingCard
                icon={<RestaurantIcon />}
                label="Dine-in"
                selected={venueType === 'Dine-In'}
                onClick={() => setVenueType(venueType === 'Dine-In' ? null : 'Dine-In')}
              />
              <RatingCard
                icon={<RestaurantIcon />}
                label="Takeout Only"
                selected={venueType === 'Takeaway'}
                onClick={() => setVenueType(venueType === 'Takeaway' ? null : 'Takeaway')}
              />
            </div>
          </section>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SettingsMenu;
