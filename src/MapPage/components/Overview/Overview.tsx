import { type FC } from 'react';

import useFetchPlaceCount from './InputHook/useFetchPlaceCount';
import TitleBlock from './TitleBlock/TitleBlock';
import TierBadge from './TierBadge/TierBadge';
import PriceBadge from './PriceBadge/PriceBadge';
import './Overview.css';

const Overview: FC = () => {
    
    const { count, tierRep, hasLoadedOnce } = useFetchPlaceCount();
    const isFirstLoading = !hasLoadedOnce;
    return (
        <div className="overview">
            <div className="overview-side-panel overview-side-panel--left" aria-hidden="true" >
                <TierBadge value={tierRep ?? 0} isFirstLoading={isFirstLoading} />
            </div>
            <div className="overview-center-element">
                <TitleBlock count={count} />
            </div>
            <div className="overview-side-panel overview-side-panel--right">
                <PriceBadge />
            </div>
        </div>
    );
};

export default Overview;
