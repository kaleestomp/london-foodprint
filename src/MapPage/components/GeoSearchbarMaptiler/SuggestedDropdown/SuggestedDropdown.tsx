import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import DirectionsOutlinedIcon from '@mui/icons-material/DirectionsOutlined';

import type { GeoSuggestion } from '../../GeoSearch/types';

import './SuggestedDropdown.css';

const SuggestedDropdown: React.FC<{
  dropdownId: string;
  showDropdown: boolean;
  isLoading: boolean;
  suggestions: GeoSuggestion[];
  onSelect: (suggestion: GeoSuggestion) => void;
}> = ({ dropdownId, showDropdown, isLoading, suggestions, onSelect }) => (
  <div className={`geo-searchbar-dropdown-wrap${showDropdown ? ' is-open' : ''}`} aria-hidden={!showDropdown}>
    <div className="geo-searchbar-divider" aria-hidden="true" />
    <ul id={dropdownId} className="geo-searchbar-dropdown" role="listbox">
      {isLoading && suggestions.length === 0 && (
        <li className="geo-searchbar-status">Searching...</li>
      )}
      {suggestions.map((suggestion) => (
        <li
          key={suggestion.id}
          className="geo-searchbar-option"
          role="option"
          onMouseDown={(event) => {
            event.preventDefault();
            onSelect(suggestion);
          }}
        >
          <span className="geo-searchbar-option-pin" aria-hidden="true">
            {suggestion.expectsBoundary
              ? <LayersOutlinedIcon fontSize="small" />
              : suggestion.expectsStreet
                ? <DirectionsOutlinedIcon fontSize="small" />
                : <PlaceOutlinedIcon fontSize="small" />}
          </span>
          <span className="geo-searchbar-option-text">
            <span className="geo-searchbar-option-primary">{suggestion.primary}</span>
            {suggestion.secondary && (
              <span className="geo-searchbar-option-secondary">{suggestion.secondary}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

export default SuggestedDropdown;
