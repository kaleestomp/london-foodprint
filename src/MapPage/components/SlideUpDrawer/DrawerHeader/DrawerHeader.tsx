import type { FC } from 'react';

import Overview from '../../Overview/Overview';
import { useDrawerState } from '../DrawerStateContext';
import { useRenderedList } from '../../RestaurantList/RenderedListContext';
import PlaceDetail from '../../PlaceDetail/PlaceDetail';
import './DrawerHeader.css';

const DrawerHeader: FC = () => {

  const { isClosed } = useDrawerState();
  const { unmatchedPlaceId } = useRenderedList();
  const showPlaceDetail = unmatchedPlaceId !== null; 
  return (
    <div className={`drawer-header ${!isClosed ? 'is-open' : ''}`}>
      {!showPlaceDetail ? <Overview /> : <PlaceDetail placeId={unmatchedPlaceId} />}
    </div>
  );
};

export default DrawerHeader;
