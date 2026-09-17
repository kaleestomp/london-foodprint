import { type FC } from 'react';

import { useAppUI } from '../../../../context/AppUIContext';
import { useDrawerState } from '../DrawerStateContext';
import { usePlaceDetailCardState } from '../../../../context/PlaceDetailCardContext';
import { usePlaceSelection } from '../../../../context/PlaceSelectionContext';
import Overview from '../../Overview/Overview';
import PlaceHeader from '../../PlaceDetail/PlaceHeader/PlaceHeader';
import './Header.css';

const Header: FC = () => {
  
  const { activeToolbarTab } = useAppUI();
  const { isClosed } = useDrawerState();
  const { showOnList: showPlaceOnList, showOnDrawer: showPlace } = usePlaceDetailCardState();
  const { selectedPlaceId } = usePlaceSelection();

  const hideHeader = showPlaceOnList;// || activeToolbarTab === 'cuisine';
  const showSettings = Boolean(activeToolbarTab);
  const showPlaceCompact = showPlace ? (showPlace && isClosed)
    : (isClosed && Boolean(selectedPlaceId));
  const mountPlaceDetail = !hideHeader && (showPlace || showPlaceCompact);
  const mountOverview = showSettings || !mountPlaceDetail;
  
  return (
    <div className={`drawer-header ${hideHeader ? 'is-hidden' : !isClosed ? 'is-open' : ''}`}>
      {mountOverview && <Overview />}
      {mountPlaceDetail && <PlaceHeader placeId={selectedPlaceId} compact={showPlaceCompact} />}
    </div>
    
  );
};

export default Header;
