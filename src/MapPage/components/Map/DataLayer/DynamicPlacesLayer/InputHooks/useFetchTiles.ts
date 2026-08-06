import { useMemo, useEffect } from 'react';

import useRequestTiles from '../../../../../request/useRequestTiles/useRequestTiles';
import type { RequestStatus } from '../../../../../request/useRequestTiles/useRequestTiles';
import { type TilesResponse } from '../../../../../request/useRequestTiles/request';
import { useSearchFilters } from '../../../../../../context/SearchFiltersContext';
import { useTileQuery } from '../../../../../../context/TileQueryContext';

// import delayLoadingScreen from './delayLoadingScreen';

type Response = {
  status: RequestStatus;
  res: TilesResponse | null;
  isPlaceholderData: boolean;
};
const useFetchTiles = (enabled: boolean = true): Response => {

  // Get Current Viewport Params (bounds, zoom)
  const { viewportParams, setLastTilesParams } = useTileQuery();
  const { effectiveCuisines, venueType, effectivePriceRanges, scoreBasis, scoreTier } = useSearchFilters();

  // Assemble API Request Params
  const requestParams = useMemo(() => {
    if (!enabled) return null;
    if (!viewportParams) return null;
    return {
      ...viewportParams,
      cuisines: effectiveCuisines,
      venue_type: venueType ?? '',
      cost: effectivePriceRanges,
      score_basis: scoreBasis,
      score_tier: scoreTier,
    };
  }, [
    viewportParams, effectiveCuisines, 
    venueType, effectivePriceRanges, 
    scoreBasis, scoreTier, enabled
  ]);

  // Call Request
  const { status, res, isFetching, isPlaceholderData } = useRequestTiles(requestParams);

  // REPORT PARAMS TO CONTEXT
  useEffect(() => { 
    if (!enabled) return;
    if (!requestParams) return;
    if (isFetching) return; // Don't report params while fetching
    if (isPlaceholderData) return; // Don't report while data is previous-key
    // if (status !== 'success') return; // Don't report params if request failed
    setLastTilesParams(requestParams); 
  }, [requestParams, isFetching, isPlaceholderData, status, setLastTilesParams, enabled]);
  
  // Delay Loading Screen (if applicable)
  // if (enabled) {
  //   delayLoadingScreen(status);
  // }
  
  return { status, res, isPlaceholderData };
};

export default useFetchTiles;
