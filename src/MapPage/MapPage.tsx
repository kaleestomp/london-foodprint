import React, { useRef } from 'react'; 
import L from 'leaflet';

import Map from './components/Map/Map'; 
import Loading from '../components/Loading/Loading';
import BubbleAvatar from './components/BubbleAvatar/BubbleAvatar';
import IPLocationHandler from './components/Map/IPLocationHandler/IPLocationHandler';
import { useAppUI } from '../context/AppUIContext';
import PullDownPanel from './components/PullDownPanel/PullDownPanel';
import RestaurantInfoPanel from './components/RestaurantInfoPanel/RestaurantInfoPanel';
import { RestaurantPanelSnapProvider } from './components/RestaurantInfoPanel/RestaurantPanelSnapContext';
import { TileQueryProvider } from '../context/TileQueryContext';
import { PlaceSelectionProvider } from '../context/PlaceSelectionContext';
import { BubbleAvatarStateProvider } from './components/BubbleAvatar/BubbleAvatarStateContext';

import './MapPage.css';

const MapPage: React.FC = () => {

  const { isLoading } = useAppUI()!;
  const mapRef = useRef<L.Map | null>(null);
  // console.log('liveLocation:', liveLocation);
  IPLocationHandler({ mapRef });

  return (
    <div className="map-page-container">
      <Loading loading={isLoading} />
      <div className='map-card-viewport'>
        <TileQueryProvider>
          <PlaceSelectionProvider>
            <Map mapRef={mapRef} />
            <PullDownPanel mapRef={mapRef} />
            <RestaurantPanelSnapProvider>
              <RestaurantInfoPanel />
              <BubbleAvatarStateProvider>
                <BubbleAvatar mapRef={mapRef} />
              </BubbleAvatarStateProvider>
            </RestaurantPanelSnapProvider>
          </PlaceSelectionProvider>
        </TileQueryProvider>
      </div>
    </div>
  );
};

export default MapPage;
