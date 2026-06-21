import React, { useRef } from 'react'; 
import L from 'leaflet';

import Map from './components/Map/Map'; 
import Loading from '../components/Loading/Loading';
import BubbleAvatar from './components/BubbleAvatar/BubbleAvatar';
import IPLocationHandler from './components/Map/IPLocationHandler/IPLocationHandler';
import { useAppUI } from '../context/AppUIContext';
import PullDownPanel from './components/PullDownPanel/PullDownPanel';
import RestaurantInfoPanel from './components/RestaurantInfoPanel/RestaurantInfoPanel';
import { PlacesQueryProvider } from './context/PlacesQueryContext';

import './MapPage.css';

const MapPage: React.FC = () => {

  const { isLoading } = useAppUI()!;
  const mapRef = useRef<L.Map | null>(null);
  // console.log('liveLocation:', liveLocation);
  IPLocationHandler({ mapRef });

  return (
    <PlacesQueryProvider>
      <div className="map-page-container">
        <Loading loading={isLoading} />
        <div className='map-card-viewport'>
          <div className='map-canvas-wrapper'>
            <Map mapRef={mapRef} />
            <PullDownPanel mapRef={mapRef} />
            <RestaurantInfoPanel mapRef={mapRef} />
            <BubbleAvatar mapRef={mapRef} />
          </div>
        </div>
      </div>
    </PlacesQueryProvider>
  );
};

export default MapPage;
