import type { FC } from 'react';

import Overview from '../../Overview/Overview';
import { useDrawerState } from '../DrawerStateContext';
import { useRenderedList } from '../../RestaurantList/RenderedListContext';
import { usePlaceSelection } from '../../../../context/PlaceSelectionContext';
// import PlaceDetail from '../../PlaceDetail/PlaceDetail';
import './DrawerHeader.css';

const DrawerHeader: FC = () => {

  const { isClosed } = useDrawerState();
  const { unmatchedPlaceId } = useRenderedList();
  const { selectedPlaceId } = usePlaceSelection();
  const hideHeader = !isClosed && selectedPlaceId !== null && unmatchedPlaceId === null;
  return (
    <div className={`drawer-header ${hideHeader ? 'is-hidden' : !isClosed ? 'is-open' : ''}`}>
      <Overview/>
    </div>
    //<PlaceDetail placeId={selectedPlaceId} />
  );
};

export default DrawerHeader;
