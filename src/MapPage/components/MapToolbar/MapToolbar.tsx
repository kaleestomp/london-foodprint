import { memo, useState } from 'react';
import type maplibregl from 'maplibre-gl';

import { useAppUI } from '../../../context/AppUIContext';
import { useIsMobileCtx } from '../../../context/IsMobileContext';
import { useDrawerState } from '../SlideUpDrawer/DrawerStateContext';
// import { usePullUpPanelSnapState } from '../PullUpPanel/SnapHooks/PullUpPanelSnapContext';
import GeoSearchbar from '../GeoSearchbarDepreciated/GeoSearchbar';
import MyLocationButton from './MyLocationButtonFAB/MyLocationButton';
// import LayersButton from './LayersButton/LayersButton';
import NorthResetButton from './NorthResetButton/NorthResetButton';

import './MapToolbar.css';

type Props = {
  mapRef: React.RefObject<maplibregl.Map | null>;
};

const MapToolbar: React.FC<Props> = ({
  mapRef,
}) => {

  const isMobile = useIsMobileCtx();
  const { isClosed } = useDrawerState();
  const { activeToolbarTab } = useAppUI();
  const { queueLiveLocationDrop } = useAppUI();
  // const { snapState } = usePullUpPanelSnapState();
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const shouldHideMapToolbar = isMobile && !isClosed;
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
        <MyLocationButton
          onLiveLocationDrop={queueLiveLocationDrop}
        />
      </div>
    </div>
  );
};

export default memo(MapToolbar);
