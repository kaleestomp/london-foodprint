import { useCallback, useId } from 'react';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import DirectionsOutlinedIcon from '@mui/icons-material/DirectionsOutlined';

import { useGeoSearch } from '../GeoSearch/GeoSearchContext';
import GeoSearchbarInput from '../GeoSearchbarDepreciated/InputBox/GeoSearchbarInput';
import GeoSearchbarClearButton from '../GeoSearchbarDepreciated/ClearButton/GeoSearchbarClearButton';
import GeoSearchbarInitializeButton from '../GeoSearchbarDepreciated/InitializeButton/GeoSearchbarInitializeButton';
import useGeoSearchbarAnimation from '../GeoSearchbarDepreciated/animationHooks/useGeoSearchbarAnimation';
import type { GeoSuggestion } from '../GeoSearch/types';

import '../GeoSearchbarDepreciated/GeoSearchbar.css';
import '../GeoSearchbarDepreciated/DropDown/GeoSearchbarDropdown.css';

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
    expanded,
    isCollapsing,
    showExpandedLayout,
    showDropdown,
    reopenSearch,
    onExpand,
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
    <div
      ref={rootRef}
      className={`geo-searchbar${expanded ? ' is-expanded' : ''}${isCollapsing ? ' is-collapsing' : ''}`}
    >
      {!showExpandedLayout ? (
        <GeoSearchbarInitializeButton
          dropdownId={dropdownId}
          showDropdown={showDropdown}
          onExpand={onExpand}
        />
      ) : (
        <div className="geo-searchbar-panel">
          <GeoSearchbarInput
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
          <MaptilerSearchDropdown
            dropdownId={dropdownId}
            showDropdown={showDropdown}
            isLoading={isLoading}
            suggestions={suggestions}
            onSelect={handleSelect}
          />
        </div>
      )}
    </div>
  );
};

type DropdownProps = {
  dropdownId: string;
  showDropdown: boolean;
  isLoading: boolean;
  suggestions: GeoSuggestion[];
  onSelect: (suggestion: GeoSuggestion) => void;
};

const MaptilerSearchDropdown: React.FC<DropdownProps> = ({
  dropdownId,
  showDropdown,
  isLoading,
  suggestions,
  onSelect,
}) => (
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

export default GeoSearchbarMaptiler;
