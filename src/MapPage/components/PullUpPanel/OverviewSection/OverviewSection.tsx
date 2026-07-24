import type { FC, RefObject } from 'react';
import type L from 'leaflet';

import { useAppUI } from '../../../../context/AppUIContext';
import PriceFilterPanel from './PriceFilter/PriceFilterPanel';
import CuisineFilterPanel from './CuisineFilter/CuisineFilterPanel';
import RatingFilterPanel from './RatingFilter/RatingFilterPanel';

import './OverviewSection.css';

type Props = {
    mapRef: RefObject<L.Map | null>;
};
const OverviewSection: FC<Props> = ({ mapRef }) => {

    const { activeToolbarTab } = useAppUI();
    const filterContent = activeToolbarTab === 'price'
        ? <PriceFilterPanel mapRef={mapRef} />
        : activeToolbarTab === 'cuisine'
            ? <CuisineFilterPanel mapRef={mapRef} />
            : activeToolbarTab === 'rating'
                ? <RatingFilterPanel />
                : null;
    const hasContent = filterContent !== null;
    
    return (
        <div className={`overview-section${hasContent ? ' has-content' : ''}`}>
            <div className="overview-section-anim">
                <div className="overview-section-inner">
                    {filterContent}
                </div>
            </div>
        </div>
    );
};

export default OverviewSection;
