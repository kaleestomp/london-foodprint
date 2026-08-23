import { useMemo, useEffect } from 'react';

import useRequestTiles from '../../../../../request/useRequestTiles/useRequestTiles';
import type { RequestStatus } from '../../../../../request/useRequestTiles/useRequestTiles';
import { type TilesResponse } from '../../../../../request/useRequestTiles/request';
import { useSearchFilters } from '../../../../../../context/SearchFiltersContext';
import { useTileQuery } from '../../../../../../context/TileQueryContext';

type Response = {
    status: RequestStatus;
    res: TilesResponse | null;
    isPlaceholderData: boolean;
};

const useFetchTiles = (enabled: boolean = true): Response => {
    const { viewportParams, setLastTilesParams } = useTileQuery();
    const { effectiveCuisines, venueType, effectivePriceRanges, scoreBasis, scoreTier } = useSearchFilters();
    
    const requestParams = useMemo(() => {
        if (!enabled) return null;
        if (!viewportParams) return null;
        return {
            ...viewportParams,
            res: Math.min(viewportParams.res + 1, 12),
            cuisines: effectiveCuisines,
            venue_type: venueType ?? '',
            cost: effectivePriceRanges,
            score_basis: scoreBasis,
            score_tier: scoreTier,
            agg_center: true,
            places_only: false,
        };
    
    }, [
        viewportParams, effectiveCuisines,
        venueType, effectivePriceRanges,
        scoreBasis, scoreTier, enabled,
    ]);

    const { status, res, isFetching, isPlaceholderData } = useRequestTiles(requestParams);
    
    useEffect(() => {
        if (!enabled) return;
        if (!requestParams) return;
        if (isFetching) return;
        if (isPlaceholderData) return;
        setLastTilesParams(requestParams);
    }, [requestParams, isFetching, isPlaceholderData, status, setLastTilesParams, enabled]);

    return { status, res, isPlaceholderData };
};

export default useFetchTiles;