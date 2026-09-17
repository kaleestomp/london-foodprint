import { type FC, useRef } from 'react'; //, { useRef }
import type * as maplibregl from 'maplibre-gl';

import { useAppUI } from '../context/AppUIContext';
import { ViewportQueryProvider } from '../context/ViewportQueryContext.tsx';
import { PlaceSelectionProvider } from '../context/PlaceSelectionContext';
import { TopPlacesProvider } from '../context/TopPlacesContext';
import { DrawerStateProvider } from './components/SlideUpDrawer/DrawerStateContext';
import { GeoSearchProvider } from './components/GeoSearch/GeoSearchContext';
import { useIsMobileCtx } from '../context/IsMobileContext';
import { PlaceDetailCardProvider } from '../context/PlaceDetailCardContext';

import Map from './components/Map/Map';
import { MapLocationNavigationProvider } from './components/Map/MapNavigationContext/MapLocationNavigationContext.tsx';
import MapNavigationController from './components/Map/MapNavigationContext/MapNavigationController';
import Loading from '../components/Loading/Loading';
// import BubbleAvatar from './components/BubbleAvatar/BubbleAvatar';
// import BaseToolbar from './components/BaseToolbar/BaseToolbar';
import MapToolbar from './components/MapToolbar/MapToolbar';
import DrawerMapViewportSync from './components/MapViewportSync/DrawerMapViewportSync';
import DesktopPanel from './components/DesktopPanel/DesktopPanel';
import { BubbleAvatarStateProvider } from './components/BubbleAvatar/BubbleAvatarStateContext';

import SlideUpDrawer from './components/SlideUpDrawer/SlideUpDrawer.tsx';
import DesktopDock from './components/DesktopDock/DesktopDock';

// import { useCityContext } from '../context/CityContext';


import './MapPage.css';

const MapPage: FC = () => {
  const { isLoading } = useAppUI()!;
  const isMobile = useIsMobileCtx();
  const mapRef = useRef<maplibregl.Map | null>(null);

  // const { reportCity } = useCityContext();
  // useEffect(() => {
  //   reportCity('newcastle');
  // }, [reportCity]);

  return (
    <div className="map-page-container">
      <Loading loading={isLoading} />

      <div className='map-viewport'>
        <ViewportQueryProvider>
          <PlaceSelectionProvider>
            <TopPlacesProvider>
              <GeoSearchProvider>
                <MapLocationNavigationProvider>
                  <Map mapRef={mapRef} />

                  <DrawerStateProvider>
                    <MapNavigationController mapRef={mapRef} />
                    <div className="map-safe-area">
                      <DrawerMapViewportSync mapRef={mapRef} />
                      <MapToolbar mapRef={mapRef} />

                      <PlaceDetailCardProvider>
                        {!isMobile && <DesktopPanel mapRef={mapRef} />}

                        <BubbleAvatarStateProvider>
                          {isMobile
                            ? <SlideUpDrawer mapRef={mapRef} />
                            : <DesktopDock mapRef={mapRef} />}
                        </BubbleAvatarStateProvider>

                      </PlaceDetailCardProvider>
                    </div>
                  </DrawerStateProvider>
                </MapLocationNavigationProvider>

              </GeoSearchProvider>
            </TopPlacesProvider>
          </PlaceSelectionProvider>
        </ViewportQueryProvider>
      </div>

    </div>
  );
};

export default MapPage;
