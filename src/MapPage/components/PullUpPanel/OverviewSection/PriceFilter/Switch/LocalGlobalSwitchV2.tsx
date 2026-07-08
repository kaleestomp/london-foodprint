import Typography from '@mui/material/Typography';
import SecondarySwitch from '../../../../../../components/Switch/SecondarySwitch';

import './Switch.css';

type Props = {
  isGlobal: boolean;
  setIsGlobal: React.Dispatch<React.SetStateAction<boolean>>;
};

const LocalGlobalSwitch: React.FC<Props> = ({ isGlobal, setIsGlobal }) => {
  return (
    <div className="scope-toggle-group">
      <Typography variant="caption" className="scope-label left">
        Whole City
      </Typography>
      <SecondarySwitch
        checked={isGlobal}
        onChange={(event) => setIsGlobal(event.target.checked)}
        slotProps={{ input: { 'aria-label': 'Toggle between local and city-wide price chart' } }}
      />
    </div>
  );
};

export default LocalGlobalSwitch;

