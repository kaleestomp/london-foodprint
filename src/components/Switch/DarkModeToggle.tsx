import type { FC } from 'react';

import MaterialUISwitch from './MaterialUISwitch';
import { useAppUI } from '../../context/AppUIContext';

const DarkModeToggle: FC = () => {
  const { colorMode, setColorMode } = useAppUI();

  return (
    <div className="restaurant-theme-toggle">
      <span className="restaurant-theme-toggle-label">{colorMode === 'dark' ? 'Dark' : 'Light'}</span>
      <MaterialUISwitch
        checked={colorMode === 'dark'}
        onChange={(event) => setColorMode(event.target.checked ? 'dark' : 'light')}
        slotProps={{ input: { 'aria-label': 'Toggle light and dark mode' } }}
      />
    </div>
  );
};

export default DarkModeToggle;
