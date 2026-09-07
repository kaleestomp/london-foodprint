import { useCallback, useRef } from 'react';
import IconButton from '@mui/material/IconButton';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';

import { useGeoSearch } from './GeoSearchContext';

import './GeoSearchbar.css';

const GeoSearchbar: React.FC = () => {

  const {
    query,
    setQuery,
    clearSearch,
  } = useGeoSearch();

  const inputRef = useRef<HTMLInputElement | null>(null);

  const onInputKeyDown: React.KeyboardEventHandler<HTMLInputElement> = useCallback((event) => {
    if (event.key !== 'Escape') { return; }
    event.preventDefault();
    clearSearch();
  }, [clearSearch]);

  const onClear = useCallback(() => {
    clearSearch();
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [clearSearch]);

  return (
    <div
      className="drawer-geo-search"
      data-vaul-no-drag
    >
      <div className="drawer-geo-search-shell">
        <span className="drawer-geo-search-lead" aria-hidden="true">
          <SearchOutlinedIcon fontSize="medium" />
        </span>
        <input
          ref={inputRef}
          className="drawer-geo-search-input"
          type="text"
          value={query}
          placeholder=""
          aria-label="Search places"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onInputKeyDown}
        />
        {query.length > 0 && (
          <IconButton
            className="drawer-geo-search-clear"
            aria-label="Clear search"
            onClick={onClear}
          >
            <CloseOutlinedIcon fontSize="small" />
          </IconButton>
        )}
      </div>
    </div>
  );
};

export default GeoSearchbar;
