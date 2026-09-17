import type { FC } from 'react';

import { type PlacesListItem } from '../../../../../request/useRequestPlacesList/request';
import { type PlaceDetailResponse } from '../../../../../request/useRequestPlaceDetail/request';
import getCuisineIconSrc from '../../../../Map/DataLayer/TopPlacesLayer/syncMarkers/markers/getCuisineIconSrc';
import brightenColor from '../../../../../../utils/format/brightenColor';

import './ItemIcon.css';

const ItemIcon: FC<{
    item: PlaceDetailResponse | PlacesListItem;
    accentColor?: string | null;
}> = ({ item, accentColor }) => {
    
    const cuisineIconSrc = getCuisineIconSrc(item.cuisine_type ?? undefined);
    const backgroundColor = accentColor ? brightenColor(accentColor, 0.1) : undefined;

    return (
        <div className="list-item-icon-column" aria-hidden="true">
            <div className="list-item-icon-badge" style={{ background: backgroundColor ?? undefined }}>
                <img
                    src={cuisineIconSrc}
                    alt={item.cuisine_type ?? 'Cuisine'}
                    className="list-item-icon"
                    draggable={false}
                    decoding="async"
                />
            </div>
        </div>
    );
};

export default ItemIcon;
