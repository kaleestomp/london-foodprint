import { type FC } from 'react';

import Overview from '../../Overview/Overview';
import { useDrawerState } from '../DrawerStateContext';
import { useRenderedList } from '../../RestaurantList/RenderedListContext';
import { usePlaceSelection } from '../../../../context/PlaceSelectionContext';
import './DrawerHeader.css';

const DrawerHeader: FC = () => {

  const { isClosed } = useDrawerState();
  const { showPlaceMainDrawer } = useRenderedList();
  const { selectedPlaceId } = usePlaceSelection();

  const hideHeader = showPlaceMainDrawer || (!isClosed && selectedPlaceId !== null);
  const headerState = hideHeader ? 'is-hidden' : !isClosed ? 'is-open' : '';
  
  return (
    <div className={`drawer-header ${headerState}`}>
      {!showPlaceMainDrawer && <Overview />}
    </div>
    
  );
};

export default DrawerHeader;
