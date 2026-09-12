import type { FC } from 'react';

import Overview from '../../Overview/Overview';
import './DrawerHeader.css';

const DrawerHeader: FC = () => {

  return (
    <div className="drawer-header">
      <Overview />
    </div>
  );
};

export default DrawerHeader;
