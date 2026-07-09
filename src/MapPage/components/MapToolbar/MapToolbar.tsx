import IconButton from '@mui/material/IconButton';
import L from 'leaflet';

import { type ToolbarFilterTab } from '../../../context/AppUIContext';

import MyLocationButton from './MyLocationButtonFAB/MyLocationButton';
import SearchIcon from '@mui/icons-material/Search';

import './MapToolbar.css';

type Props = {
  mapRef: React.RefObject<L.Map | null>;
  onLiveLocationDrop: (lat: number, lng: number) => void;
  activeFilterTab: ToolbarFilterTab | null;
  onFilterTabToggle: (tab: ToolbarFilterTab) => void;
};

const MapToolbar: React.FC<Props> = ({
  mapRef,
  onLiveLocationDrop,
  activeFilterTab,
  onFilterTabToggle,
}) => {
  return (
    <div className="map-toolbar">
      {/* <IconButton
        className={`map-toolbar-fab ${activeFilterTab === 'rating' ? 'map-toolbar-fab-active' : ''}`}
        aria-label="Rating"
        onClick={() => onFilterTabToggle('rating')}
      >
        <span className="map-toolbar-rating-icon" aria-hidden="true">
          {ratingIcon}
        </span>
      </IconButton>
      <IconButton
        className={`map-toolbar-fab ${activeFilterTab === 'price' ? 'map-toolbar-fab-active' : ''}`}
        aria-label="Price"
        onClick={() => onFilterTabToggle('price')}
      >
        <CurrencyPoundIcon fontSize="medium" />
      </IconButton>
      <Badge
        badgeContent={cuisineCount}
        color={cuisineBadgeColor}
        invisible={cuisineCount === 0}
        overlap="circular"
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{
          '& .MuiBadge-badge': {
            width: 24,
            height: 24,
            borderRadius: '12px',
            fontSize: '0.85rem',
          },
        }}
      >
        <IconButton
          className={`map-toolbar-fab ${activeFilterTab === 'cuisine' ? 'map-toolbar-fab-active' : ''}`}
          aria-label="Cuisines"
          onClick={() => onFilterTabToggle('cuisine')}
        >
          <RamenDiningIcon fontSize="medium" />
        </IconButton>
      </Badge> */}
      <IconButton
        className={`map-toolbar-fab ${activeFilterTab === 'search' ? 'map-toolbar-fab-active' : ''}`}
        aria-label="Search"
        onClick={() => onFilterTabToggle('search')}
      >
        <SearchIcon fontSize="medium" />
      </IconButton>
      <MyLocationButton mapRef={mapRef} onLiveLocationDrop={onLiveLocationDrop} />
    </div>
  );
};

export default MapToolbar;
