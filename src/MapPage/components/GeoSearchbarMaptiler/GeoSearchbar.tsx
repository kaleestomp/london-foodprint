import { useCallback, useId } from 'react';

import { useGeoSearch } from '../GeoSearch/GeoSearchContext';
import GeoSearchInputBox from './GeoSearchInputBox/GeoSearchInputBox';
import GeoSearchbarClearButton from '../GeoSearchbarDepreciated/ClearButton/GeoSearchbarClearButton';
import useGeoSearchbarAnimation from '../GeoSearchbarDepreciated/animationHooks/useGeoSearchbarAnimation';
import type { GeoSuggestion } from '../GeoSearch/types';
import SuggestedDropdown from './SuggestedDropdown/SuggestedDropdown';

import './GeoSearchbar.css';

const GeoSearchbarMaptiler: React.FC<{
  onDropdownOpenChange?: (isOpen: boolean) => void;
}> = ({ onDropdownOpenChange }) => {
  const {
    query,
    suggestions,
    isLoading,
    setQuery,
    clearSearch,
    selectSuggestion,
  } = useGeoSearch();

  const hasDropdownContent = isLoading || suggestions.length > 0;
  const {
    rootRef,
    inputRef,
    showDropdown,
    reopenSearch,
    onInputKeyDown,
    closeDropdown,
  } = useGeoSearchbarAnimation({
    query,
    hasDropdownContent,
    onDropdownOpenChange,
  });

  const handleSelect = useCallback((suggestion: GeoSuggestion) => {
    selectSuggestion(suggestion);
    closeDropdown();
  }, [closeDropdown, selectSuggestion]);

  const dropdownId = useId();

  return (
    <div ref={rootRef} className="geo-searchbar-root">
      <div className="geo-searchbar-and-dropdown">
        <GeoSearchInputBox
          inputRef={inputRef}
          value={query}
          onFocus={reopenSearch}
          onKeyDown={onInputKeyDown}
          onChange={(value) => {
            reopenSearch();
            setQuery(value);
          }}
          showSearch
          leftAction={query && (
            <GeoSearchbarClearButton
              onClear={() => {
                clearSearch();
                closeDropdown();
              }}
            />
          )}
        />
        <SuggestedDropdown
          dropdownId={dropdownId}
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
