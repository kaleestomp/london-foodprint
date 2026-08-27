import { memo, type FC } from 'react';

import { useAppUI } from '../../../../context/AppUIContext';
import PriceFilterPanel from '../../FilterTabs/PriceFilter/PriceFilterPanel';
import CuisineFilterPanel from '../../FilterTabs/CuisineFilter/CuisineFilterPanel';
import RatingFilterPanel from '../../FilterTabs/RatingFilter/RatingFilterPanel';

import './OverviewSection.css';

const OverviewSection: FC= () => {

    const { activeToolbarTab } = useAppUI();
    const filterContent = activeToolbarTab === 'price'
        ? <PriceFilterPanel />
        : activeToolbarTab === 'cuisine'
            ? <CuisineFilterPanel />
            : activeToolbarTab === 'rating'
                ? <RatingFilterPanel />
                : null;
    const hasContent = filterContent !== null;
    
    return (
        <div className={`overview-section${hasContent ? ' has-content' : ''}`}>
            <div className="overview-section-inner">
                {filterContent}
            </div>
        </div>
    );
};

export default memo(OverviewSection);
