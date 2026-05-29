import { useState } from 'react';
import MyLocationButton from './MyLocationButton';
import useGeoSearch, { type LocationResult } from './useGeoSearch';
import useGeoSearchHandler from '../../Map/GeoSearchHandler/GeoSearchHandler';
import GeoSearchDropdown from './GeoSearchDropdown';

import SearchIcon from '@mui/icons-material/Search';
import './GeoSearch.css';

type Props = {
  mapRef: React.RefObject<L.Map | null>;
};
const GeoSearch: React.FC<Props> = ({ mapRef }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState<LocationResult | null>(null);
  const { suggestions, isLoading } = useGeoSearch(query);

  useGeoSearchHandler(mapRef, location);

  const onSelect = (result: LocationResult) => {
    setLocation(result);
    setQuery(result.display_name);
    setOpen(false);
  };

  const showDropdown = open && (suggestions.length > 0 || isLoading);

  return (
    <div className={`geo-search-container${showDropdown ? ' open' : ''}`}>
      <div className="geo-search-input-wrapper">
        <span className="geo-search-icon">
          <SearchIcon />
        </span>
        <input
          className="geo-search-input"
          type="text"
          placeholder="Search Location"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        <span className="geo-search-actions-divider" />
        <MyLocationButton mapRef={mapRef} />
      </div>
      {showDropdown && (
        <GeoSearchDropdown
          suggestions={suggestions}
          isLoading={isLoading}
          onSelect={onSelect}
        />
      )}
    </div>
  );
};

export default GeoSearch;
