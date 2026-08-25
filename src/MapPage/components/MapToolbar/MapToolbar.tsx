import { memo, useState } from 'react';
import type maplibregl from 'maplibre-gl';

import { useAppUI } from '../../../context/AppUIContext';
import { usePullUpPanelSnapState } from '../PullUpPanel/SnapHooks/PullUpPanelSnapContext';
import GeoSearchbar from '../GeoSearchbar/GeoSearchbar';
import LayersButton from './LayersButton/LayersButton';
import NorthResetButton from './NorthResetButton/NorthResetButton';
// import MyLocationButton from './MyLocationButtonFAB/MyLocationButton';

import './MapToolbar.css';

type Props = {
  mapRef: React.RefObject<maplibregl.Map | null>;
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
      <div className="map-toolbar-side-action" aria-hidden={isSearchDropdownOpen}>
        <NorthResetButton mapRef={mapRef} />
        <LayersButton />
        {/* <MyLocationButton mapRef={mapRef} onLiveLocationDrop={() => {}} /> */}
      </div>
    </div>
  );
};

export default memo(MapToolbar);
