import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import AppsRoundedIcon from '@mui/icons-material/AppsRounded';
import type { SwitchProps } from '@mui/material/Switch';

import BaseSwtich from './BaseSwtich/BaseSwtich';
import './CuisineSwitch.css';


const ChipsToBarsSwitch: React.FC<{
  checked: boolean;
  onChange: NonNullable<SwitchProps['onChange']>;
}> = ({ checked, onChange }) => {
  return (
    <div className="switch-row">
      <BaseSwtich
        leftIcon={<AppsRoundedIcon />}
        rightIcon={<BarChartRoundedIcon />}
        leftLabel="Items"
        rightLabel="Graph"
        checked={checked}
        onChange={onChange}
        slotProps={{ input: { 'aria-label': 'Cuisine include or exclude mode' } }}
      />
    </div>
  );
};

export default ChipsToBarsSwitch;
