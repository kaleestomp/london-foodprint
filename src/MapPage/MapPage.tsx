import React, { useRef, useState } from 'react'; 
import L from 'leaflet';

import Map from './components/Map/Map'; 
import Loading from '../components/Loading/Loading';
import { type LatLng } from './components/BubbleAvatar/config';
import BubbleAvatar from './components/BubbleAvatar/BubbleAvatar';
import IPLocationHandler from './components/Map/IPLocationHandler/IPLocationHandler';
import { useAppUI } from '../context/AppUIContext';
import PullDownPanel from './components/PullDownPanel/PullDownPanel';

import './MapPage.css';

const MapPage: React.FC = () => {

  const { isLoading } = useAppUI()!;
  const mapRef = useRef<L.Map | null>(null);
  const [searchMask, setSearchMask] = useState<{ center: LatLng; radiusM: number } | null>(null);
  const { liveLocation } = useAppUI();
  
  IPLocationHandler({ mapRef });

  return (
    <div className="map-page-container">
      <Loading loading={isLoading} />
      <div className='map-card-viewport'>
        <div className='map-canvas-wrapper'>
          <Map mapRef={mapRef} searchMask={searchMask} />
          <PullDownPanel mapRef={mapRef} />
          <BubbleAvatar mapRef={mapRef} setSearchMask={setSearchMask} liveLocation={liveLocation} />
        </div>
      </div>
    </div>
  );
};

export default MapPage;
