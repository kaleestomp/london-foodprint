import { type FC, useRef } from 'react'; //, { useRef }
import type maplibregl from 'maplibre-gl';

import { useAppUI } from '../context/AppUIContext';
import { TileQueryProvider } from '../context/TileQueryContext';
import { PlaceSelectionProvider } from '../context/PlaceSelectionContext';

import Map from './components/Map/Map';
import Loading from '../components/Loading/Loading';
// import BubbleAvatar from './components/BubbleAvatar/BubbleAvatar';
// import IPLocationHandler from './components/Map/IPLocationHandler/IPLocationHandler';
// import BaseToolbar from './components/BaseToolbar/BaseToolbar';
import MapToolbar from './components/MapToolbar/MapToolbar';
import PullUpPanelMapViewportSync from './components/MapViewportSync/PullUpPanelMapViewportSync';

import VaulDrawer from './components/SlideUpDrawer/SlideUpDrawer.tsx';
import { DrawerStateProvider } from './components/SlideUpDrawer/DrawerStateContext';


import './MapPage.css';

const MapPage: FC = () => {
  const { isLoading } = useAppUI()!;
  const mapRef = useRef<maplibregl.Map | null>(null);

  // IPLocationHandler({ mapRef });

  return (
    <div className="map-page-container">
      <Loading loading={isLoading} />
      <div className='map-card-viewport'>
        <TileQueryProvider>
          <PlaceSelectionProvider>
            <Map mapRef={mapRef} />
            <DrawerStateProvider>
              <MapToolbar mapRef={mapRef} />
              <PullUpPanelMapViewportSync mapRef={mapRef} />
              <VaulDrawer mapRef={mapRef} />
              {/* <BaseToolbar /> */}
              {/* <BubbleAvatarStateProvider>
                <BubbleAvatar mapRef={mapRef} />
              </BubbleAvatarStateProvider> */}
            </DrawerStateProvider>
          </PlaceSelectionProvider>
        </TileQueryProvider>
      </div>
    </div>
  );
};

export default MapPage;
