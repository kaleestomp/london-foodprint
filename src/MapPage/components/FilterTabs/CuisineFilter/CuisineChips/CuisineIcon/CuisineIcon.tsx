import type { CSSProperties, FC } from 'react';

import getCuisineIconSrc from '../../../../Map/DataLayer/TopPlacesLayer/syncMarkers/markers/getCuisineIconSrc';


import './CuisineIcon.css';

const CuisineIcon: FC<{
    cuisine: string | null;
    color?: string;
    iconSize?: number;
    badgeSize?: number;
}> = ({ cuisine, color, iconSize = 36, badgeSize = 45 }) => {
    
    const cuisineIconSrc = getCuisineIconSrc(cuisine ?? undefined);

    return (
        <div className="cuisine-icon-badge" 
            style={{ background: color ?? 'rgba(255, 255, 255, 0.9)', 
                '--badge-size': badgeSize + 'px', 
                '--icon-size': iconSize + 'px' } as CSSProperties
            }
        >
            <img className="cuisine-icon"
                src={cuisineIconSrc}
                alt={cuisine ?? 'Cuisine'}
                draggable={false}
            />
        </div>
    );
};

export default CuisineIcon;
