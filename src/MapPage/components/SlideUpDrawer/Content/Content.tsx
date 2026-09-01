import type { FC } from 'react';

import { useIsMobileCtx } from '../../../../context/IsMobileContext';
import RestaurantList from '../../RestaurantList/RestaurantList';
import OverviewSection from '../../FilterTabs/FilterSection';

import './Content.css';

const Content: FC<{
    panelUp: boolean;
}> = ({ panelUp }) => {

    const isMobile = useIsMobileCtx();
    const pageSize = isMobile && !panelUp ? 10 : 20;
    
    return (
        <div className={`drawer-content${panelUp ? ' open' : ''}`}>
            <OverviewSection />
            <RestaurantList pageSize={pageSize} autoUpdate={!panelUp} />
        </div>
    );
};

export default Content;
