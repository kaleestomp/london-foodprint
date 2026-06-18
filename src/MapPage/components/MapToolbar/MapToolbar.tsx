import { useId } from 'react';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import L from 'leaflet';

import { type ToolbarFilterTab } from '../../../context/AppUIContext';
import { useSearchFilters } from '../../../context/SearchFiltersContext';

import MyLocationButton from './MyLocationButtonFAB/MyLocationButton';
import RamenDiningIcon from '@mui/icons-material/RamenDining';
import CurrencyPoundIcon from '@mui/icons-material/CurrencyPound';
import SearchIcon from '@mui/icons-material/Search';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { T1Icon, T2Icon, T3Icon, T4Icon } from '../FilterTabs/RatingFilter/RatingBar/RatingIcons';

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
  const { cuisines, cuisineSelectionMode, scoreTier } = useSearchFilters();
  const halfDiamondClipId = useId().replace(/:/g, '-');
  const cuisineCount = cuisines.length;
  const cuisineBadgeColor = cuisineSelectionMode === 'exclude' ? 'warning' : 'primary';

  const ratingIcon = scoreTier === 2
    ? <T2Icon clipId={halfDiamondClipId} />
    : scoreTier === 3
      ? <T3Icon />
      : scoreTier === 4
        ? <T4Icon />
        : scoreTier === 1
          ? <T1Icon />
          : <StarBorderIcon fontSize="medium" />;

  return (
    <div className="map-toolbar">
      <IconButton
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
      </Badge>
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
