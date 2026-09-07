import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import './GeoSearchbarClearButton.css';

type Props = {
  onClear: () => void;
};

const GeoSearchbarClearButton: React.FC<Props> = ({ onClear }) => {
  return (
    <IconButton
      size="small"
      className="geo-searchbar-clear-button"
      onClick={onClear}
      aria-label="clear search"
      tabIndex={-1}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  );
};

export default GeoSearchbarClearButton;
