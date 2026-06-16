import React from 'react'; 
import L from 'leaflet';

import PullDownContainer from '../../../components/PullDownContainer/PullDownContainer';
import RatingFilterPanel from '../FilterTabs/RatingFilter/RatingFilterPanel';
import PriceFilterPanel from '../FilterTabs/PriceFilter/PriceFilterPanel';
import CuisineFilterPanel from '../FilterTabs/CuisineFilter/CuisineFilterPanel';
import GeoSearch from '../GeosearchTab/GeoSearch';
import { useAppUI } from '../../../context/AppUIContext';
import MapToolbar from '../MapToolbar/MapToolbar';


const PullDownPanel: React.FC<{ mapRef: React.RefObject<L.Map | null> }> = ({ mapRef }) => { 

    const {
        activeToolbarTab,
        queueLiveLocationDrop,
        setActiveToolbarTab,
        toggleToolbarFilterTab,
    } = useAppUI();
    
    const topPanelContent =
        activeToolbarTab === 'rating'
            ? <RatingFilterPanel />
            : activeToolbarTab === 'price'
                ? <PriceFilterPanel mapRef={mapRef} />
                : activeToolbarTab === 'cuisine'
                    ? <CuisineFilterPanel />
                    : activeToolbarTab === 'search'
                        ? <GeoSearch mapRef={mapRef} onProgrammaticDrop={queueLiveLocationDrop} />
                    : null;

    return (<>
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
    </>);
}

export default PullDownPanel;

