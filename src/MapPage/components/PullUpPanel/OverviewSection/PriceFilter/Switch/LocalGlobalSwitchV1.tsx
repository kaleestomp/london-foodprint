import Typography from '@mui/material/Typography';
import PrimarySwitch from '../../../../../../components/Switch/PrimarySwitch';
import './PriceFilterPanel.css';

type Props = {
  isGlobal: boolean;
  setIsGlobal: React.Dispatch<React.SetStateAction<boolean>>;
};

const LocalGlobalSwitch: React.FC<Props> = ({ isGlobal, setIsGlobal }) => {

  return (
    <div className="price-filter-panel__scope-row">
        <Typography variant="caption" className="price-filter-panel__scope-label price-filter-panel__scope-label--left">
        Local
        </Typography>
        <PrimarySwitch
          checked={isGlobal}
          onChange={(event) => setIsGlobal(event.target.checked)}
          slotProps={{ input: { 'aria-label': 'Toggle between local and city-wide price chart' } }}
        />
        <Typography variant="caption" className="price-filter-panel__scope-label price-filter-panel__scope-label--right">
        City-wide
        </Typography>
    </div>
  );
};

export default LocalGlobalSwitch;

