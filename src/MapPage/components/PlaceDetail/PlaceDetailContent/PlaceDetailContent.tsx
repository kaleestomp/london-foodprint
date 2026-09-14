import type { FC } from 'react';
import Typography from '@mui/material/Typography';

import ExtendedContent from '../../RestaurantList/ListItem/ItemContent/ExtendedContent/ExtendedContent';
import type { PlacesListItem } from '../../../request/useRequestPlacesList/request';
import './PlaceDetailContent.css';

// Fallback card for a selected cluster singleton marker with no matching row in the loaded list.
const PlaceDetailContent: FC<{ 
    item: PlacesListItem;
 }> = ({ item }) => {

    if (!item) return null;
    return (
        <div className="place-detail-content">
            <Typography variant="h6" className="place-detail-title" sx={{ fontWeight: 500 }}>
                {item.display_name}
            </Typography>
            <Typography variant="subtitle1" className="place-detail-subtitle">
                {item.cuisine_type ?? ''}
            </Typography>
            <ExtendedContent item={item} />
        </div>
    );
};

export default PlaceDetailContent;
