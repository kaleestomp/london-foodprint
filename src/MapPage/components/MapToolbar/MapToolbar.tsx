import { memo, useState } from 'react';
import type maplibregl from 'maplibre-gl';

import { useAppUI } from '../../../context/AppUIContext';
import { useIsMobileCtx } from '../../../context/IsMobileContext';
import { useDrawerState } from '../SlideUpDrawer/DrawerStateContext';
// import GeoSearchbar from '../GeoSearchbarMaptiler/GeoSearchbar';
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
  const { isAtFullHeight } = useDrawerState();
  const { queueLiveLocationDrop } = useAppUI();
  const [isSearchDropdownOpen, _] = useState(false);
  const isHidden = isMobile && isAtFullHeight;

  return (
    <div className={`map-toolbar ${isHidden ? 'map-toolbar-hidden' : ''}${isSearchDropdownOpen ? ' map-toolbar-search-open' : ''}`}>
      {/* <GeoSearchbar onDropdownOpenChange={setIsSearchDropdownOpen}/> */}
      <div className="map-toolbar-side-action" aria-hidden={isSearchDropdownOpen}>
        <MyLocationButton onLiveLocationDrop={queueLiveLocationDrop}/>
        <NorthResetButton mapRef={mapRef} />
      </div>
    </div>
  );
};

export default memo(MapToolbar);
