import type { FC } from 'react';

import RestaurantList from '../../PullUpPanel/RestaurantList/RestaurantList';
import OverviewSection from '../../PullUpPanel/OverviewSection/OverviewSection';

import './Content.css';

const Content: FC = () => {
        
    return (
        <div className="drawer-content">
            <OverviewSection />
            <RestaurantList />
        </div>
    );
};

export default Content;
