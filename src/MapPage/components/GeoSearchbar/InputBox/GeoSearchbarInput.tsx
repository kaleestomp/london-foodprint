import NearMeOutlinedIcon from '@mui/icons-material/NearMeOutlined';
import SearchIcon from '@mui/icons-material/Search';
import type { ReactNode } from 'react';
import './GeoSearchbarInput.css';

type Props = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onFocus: () => void;
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
  onChange: (value: string) => void;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  showSearch?: boolean;
};

const GeoSearchbarInput: React.FC<Props> = ({
  inputRef,
  value,
  onFocus,
  onKeyDown,
  onChange,
  leftAction,
  rightAction,
  showSearch = false,
}) => {
  return (
    <div className="geo-searchbar-shell">
      <span className="geo-searchbar-icon" aria-hidden="true">
        {showSearch ? <SearchIcon fontSize="small" /> : <NearMeOutlinedIcon fontSize="small" />}
      </span>
      <input
        ref={inputRef}
        className="geo-searchbar-input"
        placeholder="Find a London location..."
        value={value}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        onChange={(event) => onChange(event.target.value)}
      />
      {leftAction && (
        <div className="geo-searchbar-input-left-actions">
          {leftAction}
        </div>
      )}
      {rightAction && (
        <div className="geo-searchbar-input-actions">
          <span className="geo-searchbar-input-actions-divider" aria-hidden="true" />
          {rightAction}
        </div>
      )}
    </div>
  );
};

export default GeoSearchbarInput;
