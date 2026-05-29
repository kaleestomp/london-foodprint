import React, { useRef } from 'react'; 
import L from 'leaflet';

import Map from './Map/Map'; 
import MapToolbar from './MapToolbar/MapToolbar';
import './MapCard.css';

const MapCard: React.FC = () => { 

    const mapRef = useRef<L.Map | null>(null);
    
    return (  
        <div className='map-card-viewport'>
            <div className='map-canvas-wrapper'>
                <Map mapRef={mapRef} />
                <MapToolbar mapRef={mapRef} />
            </div>
        </div>
    );
}

export default MapCard
//React.memo(MapCard);
// memo isolates Component from processing when states/props in parent change

