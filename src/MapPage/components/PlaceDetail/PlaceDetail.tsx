import type { FC } from 'react';

import { useSearchFilters } from '../../../context/SearchFiltersContext';
import { useDrawerState } from '../SlideUpDrawer/DrawerStateContext';
import useRequestPlaceDetail from '../../request/useRequestPlaceDetail/useRequestPlaceDetail';
import calculateDistanceM from '../../../utils/geo/calculateDistanceM';

import { getCuisineColor } from '../Map/DataLayer/TopPlacesLayer/syncMarkers/markers/backdropColors/getCuisineColor';
import brightenColor from '../../../utils/format/brightenColor';
import ItemIcon from '../RestaurantList/ListItem/ItemContent/ItemIcon/ItemIcon';
import RankBadge from '../RestaurantList/ListItem/ItemContent/RankBadgeSimple/RankBadge';
import ItemSkeleton from '../RestaurantList/ListItem/ItemSkeleton/ItemSkeleton';
import CloseButton from '../RestaurantList/ListItem/CloseButton/CloseButton';
import PlaceDetailContent from './PlaceDetailContent/PlaceDetailContent';
import './PlaceDetail.css';

// Fallback card for a selected cluster singleton marker with no matching row in the loaded list.
const PlaceDetail: FC<{ placeId: string }> = ({ placeId }) => {

    const { searchMask } = useSearchFilters();
    const { isClosed } = useDrawerState();
    // const { reportSelectedPlaceId } = usePlaceSelection();

    const { status, res } = useRequestPlaceDetail(placeId);
    if (status === 'error') return null;
    const showSkeleton = status !== 'success' || !res;
    const item = showSkeleton ? null : res;
    
    const distance_m = item && searchMask?.center
        ? calculateDistanceM(searchMask?.center, { lat: item.lat, lng: item.lon })
        : null;
    const cuisineColor = item ? getCuisineColor(item.cuisine_type) : '#ffffff';
    return (
        <div className={`place-detail ${isClosed ? 'is-closed' : 'is-open'}`}
            style={{ background: isClosed ? brightenColor(cuisineColor, 0.84) : undefined }}
            onClick={!item ? undefined : () => (undefined)}
        >
            {!item ? (
                <ItemSkeleton selected={true} />
            ) : (
                <>
                    {false && true && <CloseButton onClose={() => {}} />}
                    <div className="place-detail-side-panel place-detail-side-panel--left">
                        <ItemIcon item={item} accentColor={cuisineColor} />
                    </div>
                    <div className="place-detail-center-column">
                        <PlaceDetailContent item={item} distance={distance_m} />
                    </div>
                    <div className="place-detail-side-panel place-detail-side-panel--right">
                        <RankBadge item={item} accentColor={brightenColor(cuisineColor, -0.8)} />
                    </div>
                </>
            )}
        </div>
    );
};

export default PlaceDetail;
