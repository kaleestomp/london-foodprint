import React, { useCallback, useRef, useState } from 'react'; 
import L from 'leaflet';

import Map from './Map/Map'; 
import MapToolbar from './MapToolbar/MapToolbar';
import { type LatLng } from '../BubbleAvatar/config';
import BubbleAvatar from '../BubbleAvatar/BubbleAvatar';
import IPLocationHandler from './Map/IPLocationHandler/IPLocationHandler';
import RestaurantInfoPanel from './RestaurantInfoPanel/RestaurantInfoPanel';
import './MapCard.css';

const MapCard: React.FC = () => { 

    const mapRef = useRef<L.Map | null>(null);
    const [searchMask, setSearchMask] = useState<{ center: LatLng; radiusM: number } | null>(null);
    const [programmaticDrop, setProgrammaticDrop] = useState<{ lat: number; lng: number; token: number } | null>(null);
    const [isBubbleDragging, setIsBubbleDragging] = useState(false);
    
    IPLocationHandler({ mapRef });
    const handleProgrammaticDrop = useCallback((lat: number, lng: number) => {
        setProgrammaticDrop({ lat, lng, token: Date.now() });
    }, []);

    return (  
        <div className='map-card-viewport'>
            <div className='map-canvas-wrapper'>
                <Map mapRef={mapRef} searchMask={searchMask} />
                <RestaurantInfoPanel freezeDuringBubbleDrag={isBubbleDragging} />
                <MapToolbar mapRef={mapRef} onProgrammaticDrop={handleProgrammaticDrop} />
                <BubbleAvatar
                    mapRef={mapRef}
                    setSearchMask={setSearchMask}
                    programmaticDrop={programmaticDrop}
                    onDraggingStateChange={setIsBubbleDragging}
                />
            </div>
        </div>
    );
}

export default MapCard;

