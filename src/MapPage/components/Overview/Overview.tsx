import type { FC } from 'react';

import TitleBlock from './TitleBlock/TitleBlock';
import PlacePie from './PlacePie/PlacePie';
import './Overview.css';

const Overview: FC = () => {
    return (
        <div className="overview">
            <div className="overview-side-panel overview-side-panel--left" aria-hidden="true" >
                <PlacePie percentValue={0.4} label={56} />
            </div>
            <div className="overview-center-element">
                <TitleBlock />
            </div>
            <div className="overview-side-panel overview-side-panel--right">
                
            </div>
        </div>
    );
};

export default Overview;
