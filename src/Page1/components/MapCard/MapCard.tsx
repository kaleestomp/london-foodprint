import React, { useRef, useState } from 'react'; 
import L from 'leaflet';

import Map from './Map/Map'; 
import MapToolbar from './MapToolbar/MapToolbar';
import { type LatLng } from '../BubbleAvatar/config';
import BubbleAvatar from '../BubbleAvatar/BubbleAvatar';
import IPLocationHandler from './Map/IPLocationHandler/IPLocationHandler';
import PullDownContainer from '../../../components/PullDownContainer/PullDownContainer';
import RatingFilterPanel from './MapToolbar/FilterTabs/RatingFilterPanel';
import PriceFilterPanel from './MapToolbar/FilterTabs/PriceFilterPanel';
import CuisineFilterPanel from './MapToolbar/FilterTabs/CuisineFilterPanel';
import { useAppUI, type ToolbarFilterTab as AppToolbarFilterTab } from '../../../context/AppUIContext';
import './MapCard.css';

export type ToolbarFilterTab = AppToolbarFilterTab;

const MapCard: React.FC = () => { 

    const mapRef = useRef<L.Map | null>(null);
    const [searchMask, setSearchMask] = useState<{ center: LatLng; radiusM: number } | null>(null);
    const {
        activeToolbarTab,
        liveLocation,
        queueLiveLocationDrop,
        setActiveToolbarTab,
        toggleToolbarFilterTab,
    } = useAppUI();
    
    IPLocationHandler({ mapRef });

    const topPanelContent =
        activeToolbarTab === 'rating'
            ? <RatingFilterPanel />
            : activeToolbarTab === 'price'
                ? <PriceFilterPanel />
                : activeToolbarTab === 'cuisine'
                    ? <CuisineFilterPanel />
                    : null;

    return (  
        <div className='map-card-viewport'>
            <div className='map-canvas-wrapper'>
                <Map mapRef={mapRef} searchMask={searchMask} />
                <PullDownContainer
                    isOpen={activeToolbarTab !== null}
                    onClose={() => setActiveToolbarTab(null)}
                >
                    {topPanelContent}
                </PullDownContainer>
                <MapToolbar
                    mapRef={mapRef}
                    onLiveLocationDrop={queueLiveLocationDrop}
                    activeFilterTab={activeToolbarTab}
                    onFilterTabToggle={toggleToolbarFilterTab}
                />
                <BubbleAvatar mapRef={mapRef} setSearchMask={setSearchMask} liveLocation={liveLocation} />
            </div>
        </div>
    );
}

export default MapCard;

