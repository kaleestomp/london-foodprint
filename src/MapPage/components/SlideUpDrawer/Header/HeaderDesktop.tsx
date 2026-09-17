import { type FC } from 'react';

import { useAppUI } from '../../../../context/AppUIContext';
import { usePlaceSelection } from '../../../../context/PlaceSelectionContext';
import Overview from '../../Overview/Overview';
import PlaceHeader from '../../PlaceDetail/PlaceHeader/PlaceHeader';
import './Header.css';

const Header: FC<{
  expanded: boolean;
}> = ({ expanded }) => {
  
  const { activeToolbarTab } = useAppUI();

  const { selectedPlaceId, selectionSource } = usePlaceSelection();

  const showSettings = Boolean(activeToolbarTab);
  const mountPlaceDetail = selectionSource === 'map'
    && Boolean(selectedPlaceId);
  const showPlaceCompact = mountPlaceDetail && !expanded;
  const mountOverview = showSettings || !mountPlaceDetail;

  return (
    <div className="drawer-header-slot">
      <div className={`drawer-header ${expanded ? 'is-open' : ''}`}>
        {mountOverview && <Overview />}
        {mountPlaceDetail && (
          <PlaceHeader
            key={selectedPlaceId}
            placeId={selectedPlaceId}
            compact={showPlaceCompact}
          />
        )}
      </div>
    </div>
  );
};

export default Header;
