import { useState } from 'react';
import L from 'leaflet';

import { useAppUI } from '../../../context/AppUIContext';
import { usePullUpPanelSnapState } from '../PullUpPanel/SnapHooks/PullUpPanelSnapContext';
import GeoSearchbar from '../GeoSearchbar/GeoSearchbar';
// import LayersButton from './LayersButton/LayersButton';
// import MyLocationButton from './MyLocationButtonFAB/MyLocationButton';

import './MapToolbar.css';

type Props = {
  mapRef: React.RefObject<L.Map | null>;
};

const MapToolbar: React.FC<Props> = ({
  mapRef,
}) => {
  const { activeToolbarTab } = useAppUI();
  const { isMobile, snapState } = usePullUpPanelSnapState();
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const shouldHideMapToolbar = isMobile && snapState === 'open';
  const hidden = shouldHideMapToolbar;
  const isHidden = Boolean(activeToolbarTab) || hidden;

  return (
    <div className={`map-toolbar ${isHidden ? 'map-toolbar-hidden' : ''}${isSearchDropdownOpen ? ' map-toolbar-search-open' : ''}`}>
      <GeoSearchbar
        mapRef={mapRef}
        onDropdownOpenChange={setIsSearchDropdownOpen}
      />
      {/* <div className="map-toolbar-side-action" aria-hidden={isSearchDropdownOpen}>
        <MyLocationButton mapRef={mapRef} onLiveLocationDrop={() => {}} />
      </div> */}
    </div>
  );
};

export default MapToolbar;
