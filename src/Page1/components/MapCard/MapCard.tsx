import React, { useRef, useState } from 'react'; 
import L from 'leaflet';

import Map from './Map/Map'; 
import MapToolbar from './MapToolbar/MapToolbar';
import { type LatLng } from '../BubbleAvatar/config';
import BubbleAvatar from '../BubbleAvatar/BubbleAvatar';
import './MapCard.css';

const MapCard: React.FC = () => { 

    const mapRef = useRef<L.Map | null>(null);
    const [searchMask, setSearchMask] = useState<{ center: LatLng; radiusM: number } | null>(null);

    return (  
        <div className='map-card-viewport'>
            <div className='map-canvas-wrapper'>
                <Map mapRef={mapRef} searchMask={searchMask} />
                <MapToolbar mapRef={mapRef} />
                <BubbleAvatar mapRef={mapRef} setSearchMask={setSearchMask} />
            </div>
        </div>
    );
}

export default MapCard;

