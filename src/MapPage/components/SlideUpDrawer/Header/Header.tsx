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
  const { showOnMainDrawer: showPlace } = usePlaceDetailCardState();
  const { selectedPlaceId, selectionSource } = usePlaceSelection();

  // HIDE HEADER ONLY IF SELECTION IS FROM LIST
  const hideHeader = selectionSource === 'list';
  const showSettings = Boolean(activeToolbarTab);
  const showPlaceCompact = showPlace ? (showPlace && isClosed)
    : (isClosed && Boolean(selectedPlaceId));
  const mountPlaceDetail = !hideHeader && (showPlace || showPlaceCompact);
  const mountOverview = showSettings || !mountPlaceDetail;
  
  return (
    <div className={`drawer-header-slot ${hideHeader ? 'is-hidden' : ''}`}>
      <div className={`drawer-header ${!isClosed ? 'is-open' : ''}`}>
        {mountOverview && <Overview />}
        {mountPlaceDetail && <PlaceHeader placeId={selectedPlaceId} compact={showPlaceCompact} />}
      </div>
    </div>
  );
};

export default Header;
