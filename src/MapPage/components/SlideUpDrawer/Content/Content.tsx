import type { FC } from 'react';

import { useIsMobileCtx } from '../../../../context/IsMobileContext';
import { useDrawerState } from '../../SlideUpDrawer/DrawerStateContext';
import RestaurantList from '../../RestaurantList/RestaurantList';
import OverviewSection from '../../PullUpPanel/OverviewSection/OverviewSection';

import './Content.css';

const Content: FC = () => {

    const isMobile = useIsMobileCtx();

    // PARENT PULL-UP PANEL STATES
    const { snap } = useDrawerState();
    const panelUp = snap && snap > 100 ? true : false;
    const pageSize = isMobile && !panelUp ? 10 : 20;
    
    return (
        <div className={`drawer-content${panelUp ? ' open' : ''}`}>
            <OverviewSection />
            <RestaurantList pageSize={pageSize} autoUpdate={!panelUp} />
        </div>
    );
};

export default Content;
