import type { FC } from 'react';
import type maplibregl from 'maplibre-gl';

import { useIsMobileCtx } from '../../../../context/IsMobileContext';
import RestaurantList from '../../RestaurantList/RestaurantList';
import OverviewSection from '../../FilterTabs/FilterSection';
import SuggestionList from '../../GeoSearch/SuggestionList';
import { useGeoSearch } from '../../GeoSearch/GeoSearchContext';

import './Content.css';

const Content: FC<{
    panelUp: boolean;
    mapRef: React.RefObject<maplibregl.Map | null>;
}> = ({ panelUp, mapRef }) => {

    const isMobile = useIsMobileCtx();
    const { suggestionsVisible } = useGeoSearch();
    const pageSize = isMobile && !panelUp ? 5 : 20;
    
    return (
        <div className={`drawer-content${panelUp ? ' open' : ''}`}> {/*{`drawer-content${panelUp ? ' open' : ''}`}*/}
            {suggestionsVisible ? (
                <SuggestionList />
            ) : (
                <>
                    <OverviewSection />
                    <RestaurantList mapRef={mapRef} pageSize={pageSize} autoUpdate={!panelUp} />
                </>
            )}
        </div>
    );
};

export default Content;
