import { type LocationResult } from './useGeoSearch';

type Props = {
  suggestions: LocationResult[];
  isLoading: boolean;
  filteredOutAll: boolean;
  onSelect: (result: LocationResult) => void;
};

const GeoSearchDropdown: React.FC<Props> = ({ suggestions, isLoading, filteredOutAll, onSelect }) => {
  if (isLoading && suggestions.length === 0) {
    return (
      <ul className="geo-search-dropdown">
        <li className="geo-search-loading">Searching...</li>
      </ul>
    );
  }

  if (filteredOutAll) {
    return (
      <ul className="geo-search-dropdown">
        <li className="geo-search-loading">Must be a London location</li>
      </ul>
    );
  }

  if (suggestions.length === 0) { return null; }

  return (
    <ul className="geo-search-dropdown">
      {suggestions.map((s) => {
        const comma = s.display_name.indexOf(',');
        const primary = comma > -1 ? s.display_name.slice(0, comma) : s.display_name;
        const secondary = comma > -1 ? s.display_name.slice(comma + 2) : '';
        return (
          <li key={s.place_id} className="geo-search-option" onMouseDown={() => onSelect(s)}>
            <span className="geo-search-option-pin">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </span>
            <span className="geo-search-option-text">
              <span className="geo-search-option-primary">{primary}</span>
              {secondary && <span className="geo-search-option-secondary">{secondary}</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

export default GeoSearchDropdown;
