import { type FC } from 'react';
import type * as maplibregl from 'maplibre-gl';
// import { usePlaceSelection } from '../../../../context/PlaceSelectionContext';

import { useIsMobileCtx } from '../../../../context/IsMobileContext';
import { useAppUI } from '../../../../context/AppUIContext';
import { usePlaceDetailCardState } from '../../../../context/PlaceDetailCardContext';

// import delaySwitch from '../../../../utils/timer/delayTimer';
import RestaurantList from '../../RestaurantList/RestaurantList';
import FilterSection from '../../FilterTabs/FilterSection';
import NestedDrawer from '../NestedDrawer/NestedDrawer';
import PlaceDetail from '../../PlaceDetail/PlaceDetail';

import './Content.css';


const Content: FC<{
    panelUp: boolean;
    mapRef: React.RefObject<maplibregl.Map | null>;
}> = ({ panelUp, mapRef }) => {
    
    const isMobile = useIsMobileCtx();
    const pageSize = isMobile ? 5 : 20;
    // const panelUpDelayed = delaySwitch(panelUp, 200);
    const enableList = (isMobile && panelUp) || !isMobile;

    const { activeToolbarTab } = useAppUI();
    const showSettings = Boolean(activeToolbarTab);

    const { showOnMainDrawer: showPlace, showOnNestedDrawer, placeId } = usePlaceDetailCardState();
    const hideList = showSettings || showPlace;

    return (
        <>
            <NestedDrawer launch={ showOnNestedDrawer } >
                <PlaceDetail placeId={placeId} nested />
            </NestedDrawer>
            <div className={`drawer-content${panelUp ? ' open' : ''}`}> {/*{`drawer-content${panelUp ? ' open' : ''}`}*/}

                { showSettings && <FilterSection />}
                {!hideList && <RestaurantList
                    mapRef={mapRef} pageSize={pageSize}
                    resetOverride={!panelUp} enabled={enableList}
                />}
                {showPlace && !showSettings && <PlaceDetail 
                    placeId={placeId} 
                    showHeader={false} 
                />}

            </div>
        </>
    );
};



export default Content;
