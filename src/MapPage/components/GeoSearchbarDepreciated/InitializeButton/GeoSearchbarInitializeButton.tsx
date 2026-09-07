import SearchIcon from '@mui/icons-material/Search';
import './GeoSearchbarInitializeButton.css';

type Props = {
  dropdownId: string;
  showDropdown: boolean;
  onExpand: () => void;
};

const GeoSearchbarInitializeButton: React.FC<Props> = ({ dropdownId, showDropdown, onExpand }) => {
  return (
    <button
      type="button"
      className="geo-searchbar-shell geo-searchbar-collapse-btn"
      aria-label="Open geo search"
      aria-expanded={showDropdown}
      aria-controls={dropdownId}
      onClick={onExpand}
    >
      <span className="geo-searchbar-icon" aria-hidden="true">
        <SearchIcon fontSize="small" />
      </span>
    </button>
  );
};

export default GeoSearchbarInitializeButton;
