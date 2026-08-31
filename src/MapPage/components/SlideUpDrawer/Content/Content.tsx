import type { FC } from 'react';

import { useIsMobileCtx } from '../../../../context/IsMobileContext';
import RestaurantList from '../../PullUpPanel/RestaurantList/RestaurantList';
import OverviewSection from '../../PullUpPanel/OverviewSection/OverviewSection';

import './Content.css';

const Content: FC = () => {

    const isMobile = useIsMobileCtx();

    return (
        <div className="drawer-content">
            <OverviewSection />
            <RestaurantList pageSize={isMobile ? 10 : 20} />
        </div>
    );
};

export default Content;
