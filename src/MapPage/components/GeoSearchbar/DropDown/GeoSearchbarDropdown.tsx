import NearMeOutlinedIcon from '@mui/icons-material/NearMeOutlined';
import { type LocationResult } from '../fetchHooks/useGeoSearch';
import formatSuggestions from './formatSuggestions';

import './GeoSearchbarDropdown.css';

type DropdownItem = LocationResult & {
  primary: string;
  secondary: string;
};

type Props = {
  dropdownId: string;
  showDropdown: boolean;
  isLoading: boolean;
  filteredOutAll: boolean;
  suggestions: LocationResult[];
  onSelect: (item: DropdownItem) => void;
};

const GeoSearchbarDropdown: React.FC<Props> = ({
  dropdownId,
  showDropdown,
  isLoading,
  filteredOutAll,
  suggestions,
  onSelect,
}) => {
  
  const items = formatSuggestions({ suggestions });
  const hasSuggestions = items.length > 0;

  return (
    <div className={`geo-searchbar-dropdown-wrap${showDropdown ? ' is-open' : ''}`} aria-hidden={!showDropdown}>
      <div className="geo-searchbar-divider" aria-hidden="true" />
      <ul id={dropdownId} className="geo-searchbar-dropdown" role="listbox">
        {isLoading && !hasSuggestions && (
          <li className="geo-searchbar-status">Searching...</li>
        )}
        {!isLoading && filteredOutAll && (
          <li className="geo-searchbar-status">Must be a London location</li>
        )}
        {items.map((item) => (
          <li
            key={item.place_id}
            className="geo-searchbar-option"
            role="option"
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect(item);
            }}
          >
            <span className="geo-searchbar-option-pin" aria-hidden="true">
              <NearMeOutlinedIcon fontSize="small" />
            </span>
            <span className="geo-searchbar-option-text">
              <span className="geo-searchbar-option-primary">{item.primary}</span>
              {item.secondary && (
                <span className="geo-searchbar-option-secondary">{item.secondary}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export type { DropdownItem };
export default GeoSearchbarDropdown;
