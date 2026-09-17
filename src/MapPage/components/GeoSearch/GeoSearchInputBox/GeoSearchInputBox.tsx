import SearchIcon from '@mui/icons-material/Search';
import type { ReactNode } from 'react';

import GeoSearchbarClearButton from './ClearButton/GeoSearchbarClearButton';
import './GeoSearchInputBox.css';

const GeoSearchInputBox: React.FC<{
  inputRef: React.RefObject<HTMLInputElement | null>;
  queryStr: string;
  onFocus: () => void;
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
  onChange: (value: string) => void;
  onClear: () => void;
  iconOverride?: ReactNode;
  // rightAction?: ReactNode;
}> = ({ inputRef, queryStr, onFocus, onChange, onClear, onKeyDown, iconOverride }) => {

  return (
    <div className="geo-searchbar-shell">
      <span className="geo-searchbar-icon" aria-hidden="true">
        {iconOverride ?? <SearchIcon fontSize="small" />}
      </span>
      <input ref={inputRef}
        className="geo-searchbar-input"
        placeholder="look up area or street"
        value={queryStr}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        onChange={(event) => onChange(event.target.value)}
      />
      {queryStr && (<div className="geo-searchbar-input-left-actions">
        <GeoSearchbarClearButton onClear={onClear}/>
      </div>)}
      {/* {rightAction && (
        <div className="geo-searchbar-input-actions">
          <span className="geo-searchbar-input-actions-divider" aria-hidden="true" />
          {rightAction}
        </div>
      )} */}
    </div>
  );
};

export default GeoSearchInputBox;
