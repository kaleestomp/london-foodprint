import getLatLngboxFromCircle from '../../../../../../../MapPage/components/Map/DataLayer/utils/getLatLngboxFromCircle';
import { type SearchMask } from '../../../../../../../context/SearchFiltersContext';
import { type ViewportBounds } from '../../../../../../../MapPage/components/Map/InputHooks/readViewportParams/getBucketedViewportBounds/snapViewportLatLng';

const resolveConstraint = (
    viewportParams: ViewportBounds | null,
    searchMask: SearchMask | null
): ViewportBounds | null => {
    if (!viewportParams) return null;
    const constraint = searchMask ? getLatLngboxFromCircle(searchMask) : null;
    const intersection = constraint ? {
        sw_lat: Math.max(constraint.sw_lat, viewportParams.sw_lat),
        sw_lng: Math.max(constraint.sw_lng, viewportParams.sw_lng),
        ne_lat: Math.min(constraint.ne_lat, viewportParams.ne_lat),
        ne_lng: Math.min(constraint.ne_lng, viewportParams.ne_lng),
    } : viewportParams;
    
    return intersection;
};

export default resolveConstraint;