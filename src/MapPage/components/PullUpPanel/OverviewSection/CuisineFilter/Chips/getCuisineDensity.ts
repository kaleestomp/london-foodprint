import { useMemo } from 'react';
import type L from 'leaflet';

import { useSearchFilters } from '../../../../../../context/SearchFiltersContext';
import onUserRoam from '../../../../Map/DataLayer/inputHooks/onUserRoam';
import useRequestCuisineHistogram from '../../../../../request/useRequestCuisineHistogram/useRequestCuisineHistogram';

type Props = {
    mapRef: React.RefObject<L.Map | null>;
    isGlobal: boolean;
};

const getCuisineDensity = ({ mapRef, isGlobal }: Props) => {

    const {
        effectivePriceRanges,
        venueType,
        scoreTier,
        scoreBasis,
    } = useSearchFilters();
    const viewportParams = onUserRoam(mapRef);

    const requestParams = useMemo(() => {
        if (isGlobal) {
            return {
                scope: 'citywide' as const,
                cost: effectivePriceRanges,
                venue_type: venueType ?? '',
                score_basis: scoreBasis,
                score_tier: scoreTier,
            };
        }
        if (!viewportParams) return null;
        return {
            scope: 'view' as const,
            sw_lat: viewportParams.sw_lat,
            sw_lng: viewportParams.sw_lng,
            ne_lat: viewportParams.ne_lat,
            ne_lng: viewportParams.ne_lng,
            cost: effectivePriceRanges,
            venue_type: venueType ?? '',
            score_basis: scoreBasis,
            score_tier: scoreTier,
        };
    }, [viewportParams, effectivePriceRanges, venueType, scoreBasis, scoreTier, isGlobal]);

    const { status, res } = useRequestCuisineHistogram(requestParams);


    return { status, res };
};

export default getCuisineDensity;
