import { type FC, useRef } from 'react'; //, { useRef }
import type maplibregl from 'maplibre-gl';

import { useAppUI } from '../context/AppUIContext';
import { ViewportQueryProvider } from '../context/ViewportQueryContext.tsx';
import { PlaceSelectionProvider } from '../context/PlaceSelectionContext';
import { TopPlacesProvider } from '../context/TopPlacesContext';
import { DrawerStateProvider } from './components/SlideUpDrawer/DrawerStateContext';
import { GeoSearchProvider } from './components/GeoSearch/GeoSearchContext';

import Map from './components/Map/Map';
import Loading from '../components/Loading/Loading';
// import BubbleAvatar from './components/BubbleAvatar/BubbleAvatar';
// import IPLocationHandler from './components/Map/IPLocationHandler/IPLocationHandler';
// import BaseToolbar from './components/BaseToolbar/BaseToolbar';
import MapToolbar from './components/MapToolbar/MapToolbar';
import PullUpPanelMapViewportSync from './components/MapViewportSync/PullUpPanelMapViewportSync';

import VaulDrawer from './components/SlideUpDrawer/SlideUpDrawer.tsx';

// import { useCityContext } from '../context/CityContext';


import './MapPage.css';

const MapPage: FC = () => {
  const { isLoading } = useAppUI()!;
  const mapRef = useRef<maplibregl.Map | null>(null);

  // IPLocationHandler({ mapRef });
  // const { reportCity } = useCityContext();
  // useEffect(() => {
  //   reportCity('newcastle');
  // }, [reportCity]);

  return (
    <div className="map-page-container">
      <Loading loading={isLoading} />
      <div className='map-card-viewport'>
        <ViewportQueryProvider>
          <PlaceSelectionProvider>
            <TopPlacesProvider>
              <GeoSearchProvider>
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
              </GeoSearchProvider>
            </TopPlacesProvider>
          </PlaceSelectionProvider>
        </ViewportQueryProvider>
      </div>
    </div>
  );
};

export default MapPage;
