import { useState } from 'react';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import AppsRoundedIcon from '@mui/icons-material/AppsRounded';

import BaseSwtich from './BaseSwtich/BaseSwtich';
import './CuisineSwitch.css';


const ChipsToBarsSwitch: React.FC = () => {

  const [showHistogram, setShowHistogram] = useState(false);
  return (
    <div className="switch-row">
      <BaseSwtich
        leftIcon={<AppsRoundedIcon />}
        rightIcon={<BarChartRoundedIcon />}
        leftLabel="Items"
        rightLabel="Graph"
        checked={showHistogram}
        onChange={(event) => setShowHistogram(event.target.checked)}
        slotProps={{ input: { 'aria-label': 'Cuisine include or exclude mode' } }}
      />
    </div>
  );
};

export default ChipsToBarsSwitch;
