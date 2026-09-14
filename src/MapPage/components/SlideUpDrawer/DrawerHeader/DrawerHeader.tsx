import { type FC } from 'react';

import Overview from '../../Overview/Overview';
import { useDrawerState } from '../DrawerStateContext';
import { useRenderedList } from '../../RestaurantList/RenderedListContext';
import { usePlaceSelection } from '../../../../context/PlaceSelectionContext';
// import PlaceDetail from '../../PlaceDetail/PlaceDetail';
import './DrawerHeader.css';
import PlaceDetailHeader from '../../PlaceDetail/PlaceDetailHeader/PlaceDetailHeader';

const DrawerHeader: FC = () => {

  const { isClosed } = useDrawerState();
  const { unmatchedPlaceId, showPlaceMainDrawer } = useRenderedList();
  const { selectedPlaceId } = usePlaceSelection();

  const hideHeader = !isClosed && selectedPlaceId !== null && !showPlaceMainDrawer;
  const headerState = hideHeader ? 'is-hidden' : !isClosed ? 'is-open' : '';
  
  return (
    <div className={`drawer-header ${headerState}`}>
      { showPlaceMainDrawer && unmatchedPlaceId ? 
        <PlaceDetailHeader placeId={unmatchedPlaceId} compact={isClosed} /> : <Overview/>
      }
    </div>
    
  );
};

export default DrawerHeader;
