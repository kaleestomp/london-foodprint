import { useEffect, useRef } from 'react';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import DirectionsOutlinedIcon from '@mui/icons-material/DirectionsOutlined';

import { useDrawerState } from '../SlideUpDrawer/DrawerStateContext';
import { useGeoSearch } from './GeoSearchContext';

import './SuggestionList.css';

/**
 * Suggested places list rendered as the first item of the slide-up drawer
 * content section. When fresh suggestions arrive while the drawer is at its
 * lowest snap point, the drawer is snapped open (0.5) to reveal the list.
 */
const SuggestionList: React.FC = () => {

  const { suggestions, isLoading, suggestionsVisible, selectSuggestion } = useGeoSearch();
  const { isClosed, openDrawer } = useDrawerState();

  const hasSuggestions = suggestions.length > 0;

  // Snap the drawer open only when a fresh suggestion set arrives while
  // closed — not on every render, so the user can still drag it back down.
  const previousRef = useRef(suggestions);
  useEffect(() => {
    const previous = previousRef.current;
    previousRef.current = suggestions;
    const freshSuggestions = previous.length === 0 && suggestions.length > 0;
    if (freshSuggestions && isClosed) {
      openDrawer();
    }
  }, [suggestions, isClosed, openDrawer]);

  if (!suggestionsVisible) { return null; }

  return (
    <div className="geo-suggestions">
      {isLoading && !hasSuggestions && (
        <div className="geo-suggestions-status">Searching…</div>
      )}
      {!isLoading && !hasSuggestions && (
        <div className="geo-suggestions-status">No places found in this area</div>
      )}
      {hasSuggestions && (
        <ul className="geo-suggestions-list" role="listbox" aria-label="Suggested places">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id} className="geo-suggestions-item">
              <button
                type="button"
                className="geo-suggestion"
                role="option"
                aria-selected={false}
                onMouseDown={(event) => {
                  event.preventDefault(); // keep input focus until selection completes
                  selectSuggestion(suggestion);
                }}
              >
                <span className="geo-suggestion-icon" aria-hidden="true">
                  {suggestion.expectsBoundary
                    ? <LayersOutlinedIcon fontSize="small" />
                    : suggestion.expectsStreet
                      ? <DirectionsOutlinedIcon fontSize="small" />
                      : <PlaceOutlinedIcon fontSize="small" />}
                </span>
                <span className="geo-suggestion-text">
                  <span className="geo-suggestion-primary">{suggestion.primary}</span>
                  {suggestion.secondary && (
                    <span className="geo-suggestion-secondary">{suggestion.secondary}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SuggestionList;
