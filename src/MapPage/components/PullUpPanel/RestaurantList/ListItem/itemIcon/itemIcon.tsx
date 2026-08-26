import type { FC } from 'react';

import getCuisineIconSrc from '../../../../Map/DataLayer/TopPlacesLayer/syncMarkers/markers/getCuisineIconSrc';
import { type PlacesListItem } from '../../../../../request/useRequestPlacesList/request';
import brightenColor from '../brightenColor';

import './itemIcon.css';

const itemIcon: FC<{
    item: PlacesListItem;
    accentColor?: string;
}> = ({ item, accentColor }) => {
    
    const cuisineIconSrc = getCuisineIconSrc(item.cuisine_type ?? undefined);
    const backgroundColor = accentColor ? brightenColor(accentColor, 0.1) : 'rgba(255, 255, 255, 0.9)';

    return (
        <div className="list-item-icon-column" aria-hidden="true">
            <div
              className="list-item-icon-badge"
              style={{ background: backgroundColor }}
            >
                <img
                    src={cuisineIconSrc}
                    alt={item.cuisine_type ?? 'Cuisine'}
                    className="list-item-icon"
                    draggable={false}
                />
            </div>
        </div>
    );
};

export default itemIcon;
