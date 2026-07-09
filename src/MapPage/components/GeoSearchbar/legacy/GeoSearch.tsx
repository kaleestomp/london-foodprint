import { useCallback, useState } from 'react';
import useGeoSearch, { type LocationResult } from '../fetchHooks/useGeoSearch';
import useReverseGeocode from '../fetchHooks/useReverseGeocode';
import GeoSearchDropdown from './GeoSearchDropdown';
import MyLocationButton from './MyLocationButton';

import './GeoSearch.css';

type Props = {
  mapRef: React.RefObject<L.Map | null>;
  onProgrammaticDrop: (lat: number, lng: number) => void;
};
const GeoSearch: React.FC<Props> = ({ mapRef, onProgrammaticDrop }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const { suggestions, isLoading, filteredOutAll } = useGeoSearch(query);
  const { lookup } = useReverseGeocode();

  const onSelect = (result: LocationResult) => {
    setQuery(result.display_name);
    setOpen(false);

    const lat = Number.parseFloat(result.lat);
    const lng = Number.parseFloat(result.lon);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      onProgrammaticDrop(lat, lng);
    }
  };

  const handleLiveLocationDrop = useCallback(async (lat: number, lng: number) => {
    onProgrammaticDrop(lat, lng);
    const result = await lookup(lat, lng);
    setQuery(result.display_name);
    setOpen(false);
  }, [lookup, onProgrammaticDrop]);

  const showDropdown = open && (suggestions.length > 0 || isLoading || filteredOutAll);

  return (
    <div className={`geo-search-container${showDropdown ? ' open' : ''}`}>
      <div className="geo-search-input-wrapper">
        <input
          className="geo-search-input"
          autoFocus
          placeholder="Find a London location..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        <MyLocationButton mapRef={mapRef} onLiveLocationDrop={handleLiveLocationDrop} />
      </div>
      
      {showDropdown && (
        <>
          <div className="geo-search-divider" aria-hidden="true" />
          <GeoSearchDropdown
            suggestions={suggestions}
            isLoading={isLoading}
            filteredOutAll={filteredOutAll}
            onSelect={onSelect}
          />
        </>
      )}
    </div>
  );
};

export default GeoSearch;
