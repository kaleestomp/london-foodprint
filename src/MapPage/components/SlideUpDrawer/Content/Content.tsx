import type { FC } from 'react';
import type maplibregl from 'maplibre-gl';

import { useIsMobileCtx } from '../../../../context/IsMobileContext';
import RestaurantList from '../../RestaurantList/RestaurantList';
import OverviewSection from '../../FilterTabs/FilterSection';

import './Content.css';

const Content: FC<{
    panelUp: boolean;
    mapRef: React.RefObject<maplibregl.Map | null>;
}> = ({ panelUp, mapRef }) => {

    const isMobile = useIsMobileCtx();
    const pageSize = isMobile && !panelUp ? 10 : 20;
    
    return (
        <div className={`drawer-content${panelUp ? ' open' : ''}`}>
            <OverviewSection />
            <RestaurantList mapRef={mapRef} pageSize={pageSize} autoUpdate={!panelUp} />
        </div>
    );
};

export default Content;
