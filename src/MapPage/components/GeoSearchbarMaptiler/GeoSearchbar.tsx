import { useCallback } from 'react';

import { useGeoSearch } from '../GeoSearch/GeoSearchContext';
import GeoSearchInputBox from './GeoSearchInputBox/GeoSearchInputBox';
import useGeoSearchbarAnimation from '../GeoSearch/animationHooks/useGeoSearchbarAnimation';
import useRequestMaptilerSuggestions from '../GeoSearch/request/useRequestMaptilerSuggestions/useRequestMaptilerSuggestions';
import type { GeoSuggestion } from '../GeoSearch/types';
import SuggestedDropdown from './SuggestedDropdown/SuggestedDropdown';

import './GeoSearchbar.css';

const GeoSearchbarMaptiler: React.FC<{
  onDropdownOpenChange?: (isOpen: boolean) => void;
}> = ({ onDropdownOpenChange }) => {
  
  // TRACK QUERY UI STATE
  const { query, selectSuggestion, setQuery, clearSearch } = useGeoSearch();
  // FETCH SELECTIONS
  const { suggestions, isFetching: isLoading } = useRequestMaptilerSuggestions(query);
  // HANDLE ANIMATIONS
  const hasDropdownContent = isLoading || suggestions.length > 0;
  const { rootRef, inputRef, showDropdown, reopenSearch, onInputKeyDown, closeDropdown 
  } = useGeoSearchbarAnimation({ query, hasDropdownContent, onDropdownOpenChange });

  const onInputChange = useCallback((value: string) => {
    reopenSearch();
    setQuery(value);
  }, [reopenSearch, setQuery]);
  const onInputClear = useCallback(() => {
    clearSearch();
    closeDropdown();
  }, [clearSearch, closeDropdown]); 
  const handleSelect = useCallback((suggestion: GeoSuggestion) => {
    selectSuggestion(suggestion);
    closeDropdown();
  }, [closeDropdown, selectSuggestion]);

  return (
    <div ref={rootRef} className="geo-searchbar-root">
      <div className="geo-searchbar-and-dropdown">
        <GeoSearchInputBox
          inputRef={inputRef}
          queryStr={query}
          onFocus={reopenSearch}
          onKeyDown={onInputKeyDown}
          onChange={onInputChange}
          onClear={onInputClear}
        />
        <SuggestedDropdown
          showDropdown={showDropdown}
          isLoading={isLoading}
          suggestions={suggestions}
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
};

export default GeoSearchbarMaptiler;
