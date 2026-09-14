import type { FC } from 'react';
import Typography from '@mui/material/Typography';

import { formatDistance, formatPrice } from '../../../../utils/format/formatMetrics';
// import ExtendedContent from '../../RestaurantList/ListItem/ItemContent/ExtendedContent/ExtendedContent';
import type { PlaceDetailResponse } from '../../../request/useRequestPlaceDetail/request';
import formatOpeningTime from '../formatOpeningTime';
import './PlaceDetailContent.css';

// Fallback card for a selected cluster singleton marker with no matching row in the loaded list.
const PlaceDetailContent: FC<{ 
    item: PlaceDetailResponse;
    distance?: number | null;
 }> = ({ item, distance }) => {
    const openingTime = formatOpeningTime(item.opening_time);
    if (!item) return null;
    return (
        // <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}></Typography>
        <div className="place-detail-content">
            <Typography variant="subtitle2" className="place-detail-title" sx={{ fontWeight: 700 }}>
                {item.display_name}
            </Typography>
            <Typography variant="caption" className="place-detail-subtitle" >
                {item.cuisine_type ?? ''}
            </Typography>
            <Typography variant="caption" className="place-detail-subtitle" >
                {[  formatDistance(distance), 
                    formatPrice(item.price?.trim() ?? ''),
                    openingTime ? openingTime.label : 'Closed'
                ].filter(Boolean).join(' · ')}
            </Typography>
            {/* <ExtendedContent item={item} distance={distance} /> */}
        </div>
    );
};

export default PlaceDetailContent;
