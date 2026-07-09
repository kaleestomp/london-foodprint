import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import './LayersButton.css';

const LayersButton: React.FC = () => {
  return (
    <button
      type="button"
      className="map-toolbar-layers-btn"
      aria-label="Map layers"
      title="Map layers"
    >
      <LayersOutlinedIcon fontSize="small" />
    </button>
  );
};

export default LayersButton;
