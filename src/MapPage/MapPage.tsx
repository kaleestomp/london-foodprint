import React from 'react'; //, { useRef }
// import type maplibregl from 'maplibre-gl';

// import { useAppUI } from '../context/AppUIContext';
// import { TileQueryProvider } from '../context/TileQueryContext';
// import { PlaceSelectionProvider } from '../context/PlaceSelectionContext';
// import { BubbleAvatarStateProvider } from './components/BubbleAvatar/BubbleAvatarStateContext';
// import { PullUpPanelSnapProvider } from './components/PullUpPanel/SnapHooks/PullUpPanelSnapContext.tsx';

// import Map from './components/Map/Map';
// import Loading from '../components/Loading/Loading';
// import BubbleAvatar from './components/BubbleAvatar/BubbleAvatar';
// // import IPLocationHandler from './components/Map/IPLocationHandler/IPLocationHandler';
// import PullDownPanel from './components/PullDownPanel/PullDownPanel';
// import BaseToolbar from './components/BaseToolbar/BaseToolbar';
// import MapToolbar from './components/MapToolbar/MapToolbar';
// import PullUpPanelMapViewportSync from './components/MapViewportSync/PullUpPanelMapViewportSync';
// import PullUpPanel from './components/PullUpPanel/PullUpPanel';

import VaulDrawer from './components/SlideUpDrawer/SlideUpDrawer.tsx';

import './MapPage.css';

const MapPage: React.FC = () => {
  // const { isLoading } = useAppUI()!;
  // const mapRef = useRef<maplibregl.Map | null>(null);

  // IPLocationHandler({ mapRef });

  return (
    <div className="map-page-container">
      <VaulDrawer />
      {/* <Loading loading={isLoading} />
      <div className='map-card-viewport'>
        <TileQueryProvider>
          <PlaceSelectionProvider>
            <Map mapRef={mapRef} />
            <PullUpPanelSnapProvider>
              <PullDownPanel mapRef={mapRef} />
              <MapToolbar mapRef={mapRef} />
              <PullUpPanelMapViewportSync mapRef={mapRef} />
              <PullUpPanel mapRef={mapRef} />
              <BaseToolbar />
              <BubbleAvatarStateProvider>
                <BubbleAvatar mapRef={mapRef} />
              </BubbleAvatarStateProvider>
            </PullUpPanelSnapProvider>
          </PlaceSelectionProvider>
        </TileQueryProvider>
      </div> */}
    </div>
  );
};

export default MapPage;
