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
        activeFilterTab,
        queueLiveLocationDrop,
        setActiveToolbarTab,
        toggleToolbarFilterTab,
    } = useAppUI();
    
    const topPanelContent =
        activeFilterTab === 'search'
            ? <GeoSearch mapRef={mapRef} onProgrammaticDrop={queueLiveLocationDrop} />
            : null;

    return (<>
        <PullDownContainer
            isOpen={activeFilterTab === 'search'}
            onClose={() => setActiveToolbarTab(null)}
        >
            {topPanelContent}
        </PullDownContainer>
        <MapToolbar
            mapRef={mapRef}
            onLiveLocationDrop={queueLiveLocationDrop}
            activeFilterTab={activeFilterTab}
            onFilterTabToggle={toggleToolbarFilterTab}
        />
    </>);
}

export default PullDownPanel;
