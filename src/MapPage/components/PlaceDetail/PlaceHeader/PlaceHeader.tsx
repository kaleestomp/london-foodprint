import { useEffect, useMemo, type FC } from 'react';

import useRequestPlaceDetail from '../../../request/useRequestPlaceDetail/useRequestPlaceDetail';

import { getCuisineColor } from '../../Map/DataLayer/TopPlacesLayer/syncMarkers/markers/backdropColors/getCuisineColor';
import brightenColor from '../../../../utils/format/brightenColor';
import ItemIcon from '../../RestaurantList/ListItem/ItemContent/ItemIcon/ItemIcon';
import RankBadge from '../../RestaurantList/ListItem/ItemContent/RankBadgeSimple/RankBadge';
import CloseButton from '../../RestaurantList/ListItem/CloseButton/CloseButton';
import PlaceTitleblock from './PlaceTitleblock/PlaceTitleblock';
import PlaceHeaderSkeleton from './PlaceHeaderSkeleton';
import { useDrawerState } from '../../SlideUpDrawer/DrawerStateContext';
import './PlaceHeader.css';

// Fallback card for a selected cluster singleton marker with no matching row in the loaded list.
const PlaceHeader: FC<{
    placeId: string | null;
    compact?: boolean;
}> = ({ placeId, compact }) => {
    
    const { status, res } = useRequestPlaceDetail(placeId);
    const showSkeleton = status !== 'success' || !res;
    const item = showSkeleton ? null : res;
    
    // REPORT THEME COLOR BASED ON CUISINE
    const { reportThemeColor } = useDrawerState();
    const cuisineColor = item ? getCuisineColor(item.cuisine_type) : null;
    const themeColor = useMemo(() => (
        compact ? brightenColor(cuisineColor, 0.84) : null
    ), [cuisineColor, compact]); 
    useEffect(() => { 
        reportThemeColor(themeColor);
        return () => reportThemeColor(null);
    }, [themeColor, reportThemeColor]);

    // DOM
    if (status === 'error') return null;
    if (!placeId) return null;
    if (!item) return <PlaceHeaderSkeleton compact={compact} />;
    return (
        <div className={`place-header ${compact ? 'is-closed' : 'is-open'}`}
            // style={{ background: compact ? brightenColor(cuisineColor, 0.84) : undefined }}
            onClick={() => (undefined)}
        >
            {false && true && <CloseButton onClose={() => {}} />}
            <div className="place-header-side-panel left">
                <ItemIcon item={item} accentColor={cuisineColor} />
            </div>
            <div className="place-header-center-column">
                <PlaceTitleblock item={item} compact={compact} />
            </div>
            <div className="place-header-side-panel right">
                <RankBadge item={item} hidden={!compact} accentColor={brightenColor(cuisineColor, -0.8)} />
            </div>
        </div>
    );
};

export default PlaceHeader;
