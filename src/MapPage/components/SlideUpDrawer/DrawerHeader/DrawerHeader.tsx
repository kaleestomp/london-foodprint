import { type FC } from 'react';

import Overview from '../../Overview/Overview';
import { useDrawerState } from '../DrawerStateContext';
import { useRenderedList } from '../../../../context/PlaceDetailCardContext';
import { usePlaceSelection } from '../../../../context/PlaceSelectionContext';
import './DrawerHeader.css';

const DrawerHeader: FC = () => {

  const { isClosed } = useDrawerState();
  const { showOnDrawer } = useRenderedList();
  const { selectedPlaceId } = usePlaceSelection();

  const hideHeader = showOnDrawer || (!isClosed && selectedPlaceId !== null);
  const headerState = hideHeader ? 'is-hidden' : !isClosed ? 'is-open' : '';
  
  return (
    <div className={`drawer-header ${headerState}`}>
      {!showOnDrawer && <Overview />}
    </div>
    
  );
};

export default DrawerHeader;
