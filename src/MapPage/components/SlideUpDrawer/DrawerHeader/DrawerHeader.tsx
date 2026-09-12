import type { FC } from 'react';

import Overview from '../../Overview/Overview';
import { useDrawerState } from '../DrawerStateContext';
import './DrawerHeader.css';

const DrawerHeader: FC = () => {

  const { isClosed } = useDrawerState();

  return (
    <div className={`drawer-header ${!isClosed ? 'is-open' : ''}`}>
      <Overview />
    </div>
  );
};

export default DrawerHeader;
