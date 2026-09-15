import { type FC } from 'react';
import type * as maplibregl from 'maplibre-gl';

import { useIsMobileCtx } from '../../../../context/IsMobileContext';
import { useAppUI } from '../../../../context/AppUIContext';
import { useRenderedList } from '../../RestaurantList/RenderedListContext';
// import delaySwitch from '../../../../utils/timer/delayTimer';
import RestaurantList from '../../RestaurantList/RestaurantList';
import FilterSection from '../../FilterTabs/FilterSection';
// import SampleContent from '../SampleContent/SampleContent';
// import SuggestionList from '../../GeoSearch/SuggestionList';
// import { useGeoSearch } from '../../GeoSearch/GeoSearchContext';
import NestedDrawer from '../NestedDrawer/NestedDrawer';
import PlaceDetailBody from '../../PlaceDetail/PlaceDetailBody/PlaceDetailBody';

import './Content.css';

const Content: FC<{
    panelUp: boolean;
    mapRef: React.RefObject<maplibregl.Map | null>;
}> = ({ panelUp, mapRef }) => {

    const isMobile = useIsMobileCtx();
    // const { suggestionsVisible } = useGeoSearch();
    const pageSize = isMobile ? 5 : 20;
    // const panelUpDelayed = delaySwitch(panelUp, 200);
    const enableList = (isMobile && panelUp) || !isMobile;

    const { activeToolbarTab } = useAppUI();
    const showToolbarTap = activeToolbarTab !== null;
    const { unmatchedPlaceId, showPlaceMainDrawer } = useRenderedList();
    const hideList = showToolbarTap || showPlaceMainDrawer;
    
    return (
        <div className={`drawer-content${panelUp ? ' open' : ''}`}> {/*{`drawer-content${panelUp ? ' open' : ''}`}*/}
            <NestedDrawer />
            {/* <SampleContent /> */}
            {activeToolbarTab  && <FilterSection />}
            { !hideList && 
                <RestaurantList mapRef={mapRef} pageSize={pageSize} resetOverride={!panelUp} enabled={enableList} />
            }
            
            {showPlaceMainDrawer && unmatchedPlaceId !== null 
                && <PlaceDetailBody placeId={unmatchedPlaceId} />
            }
            {/* {suggestionsVisible ? (
                <SuggestionList />
            ) : (
                <>  
                    <FilterSection />
                    {activeToolbarTab === null && 
                        <RestaurantList mapRef={mapRef} pageSize={pageSize} resetOverride={!panelUp} />
                    }
                    
                </>
            )} */}
        </div>
    );
};



export default Content;
