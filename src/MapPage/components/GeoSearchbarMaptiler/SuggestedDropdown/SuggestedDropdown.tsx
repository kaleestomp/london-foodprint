import { useId } from 'react';

import SignpostIcon from '@mui/icons-material/Signpost';
import MapIcon from '@mui/icons-material/Map';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';

import type { GeoSuggestion } from '../../GeoSearch/types';

import './SuggestedDropdown.css';

const SuggestedDropdown: React.FC<{
  showDropdown: boolean;
  isLoading: boolean;
  suggestions: GeoSuggestion[];
  onSelect: (suggestion: GeoSuggestion) => void;
}> = ({ showDropdown, isLoading, suggestions, onSelect }) => {

  const dropdownId = useId();

  return (
    <div className={`geo-searchbar-dropdown-wrap${showDropdown ? ' is-open' : ''}`} aria-hidden={!showDropdown}>
      <div className="geo-searchbar-divider" aria-hidden="true" />
      <ul id={dropdownId} className="geo-searchbar-dropdown" role="listbox">
        {isLoading && suggestions.length === 0 && (
          <li className="geo-searchbar-status">Searching...</li>
        )}
        {suggestions.map((suggestion) => (
          <li key={suggestion.id} className="geo-searchbar-option" role="option"
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect(suggestion);
            }}
          >
            <span className="geo-searchbar-option-pin" aria-hidden="true">
              {suggestion.expectsBoundary ? <MapIcon fontSize="small" />
                : suggestion.expectsPlace ? <PlaceRoundedIcon fontSize="small" />
                  : <SignpostIcon fontSize="small" />}
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
};

export default SuggestedDropdown;
