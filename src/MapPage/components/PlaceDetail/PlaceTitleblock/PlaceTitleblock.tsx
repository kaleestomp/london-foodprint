import type { FC } from 'react';
import Typography from '@mui/material/Typography';

import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import calculateDistanceM from '../../../../utils/geo/calculateDistanceM';
import { formatDistance, formatPrice } from '../../../../utils/format/formatMetrics';
// import ExtendedContent from '../../../RestaurantList/ListItem/ItemContent/ExtendedContent/ExtendedContent';
import type { PlaceDetailResponse } from '../../../request/useRequestPlaceDetail/request';
import formatOpeningTime from '../formatOpeningTime';
import './PlaceTitleblock.css';

// Fallback card for a selected cluster singleton marker with no matching row in the loaded list.
const PlaceTitleblock: FC<{
    item: PlaceDetailResponse;
    compact?: boolean;
}> = ({ item, compact }) => {

    const openingTime = formatOpeningTime(item.opening_time);
    const { searchMask } = useSearchFilters();
    const distanceM = item && searchMask?.center
        ? calculateDistanceM(searchMask?.center, { lat: item.lat, lng: item.lon })
        : null;
    const labelDistance = formatDistance(distanceM);
    const labelPrice = formatPrice(item.price?.trim() ?? '');
    const labelOpeningTime = openingTime ?
        openingTime.labelShort : 'Closed'

    if (!item) return null;
    return (
        // <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}></Typography>
        <div className="place-detail-titleblock">
            <Typography variant="subtitle2"
                className={`place-detail-title ${!compact ? 'is-extended' : ''}`}
            >
                {item.display_name}
            </Typography>
            <Typography
                variant="caption"
                className={`place-detail-subtitle ${!compact ? 'is-extended' : ''}`}
            >
                {item.cuisine_type ?? ''}
            </Typography>
            {compact && (<Typography variant="caption" className="place-detail-subtitle" >
                {[labelDistance,
                    labelPrice,
                    !(labelDistance && labelPrice) ? labelOpeningTime : ''
                ].filter(Boolean).join(' · ')}
            </Typography>)}
            {/* <ExtendedContent item={item} distance={distance} /> */}
        </div>
    );
};

export default PlaceTitleblock;
