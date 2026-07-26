import { useEffect, useMemo } from 'react';

import useRequestTiles from '../../../../request/useRequestTiles/useRequestTiles';
import type { TilesParams } from '../../../../request/useRequestTiles/useRequestTiles';
import type { RequestStatus } from '../../../../request/useRequestTiles/useRequestTiles';
import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import { useTileQuery } from '../../../../../context/TileQueryContext';
import delayLoadingScreen from './delayLoadingScreen';
import onUserRoam from './onUserRoam';

type Response = {
  status: RequestStatus;
  res: any;
  queryKey: string;
  responseKey: string;
  requestParams: TilesParams | null;
};

const callRequestTiles = (mapRef: React.RefObject<L.Map | null>, enabled = true): Response => {

  // Get Current Viewport Params (bounds, zoom)
  const viewportParams = onUserRoam(mapRef);
  const { setViewportParams } = useTileQuery();

  useEffect(() => {
    setViewportParams(viewportParams);
  }, [viewportParams, setViewportParams]);

  // Get Filter States
  const { 
    effectiveCuisines, // Sorted array of cuisines
    venueType, // Placeholder (string or null)
    effectivePriceRanges, // Array of selected price ranges - empty on default
    scoreBasis, scoreTier 
  } = useSearchFilters();

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
  const { status, res, queryKey, responseKey } = useRequestTiles(requestParams);
  
  // Delay Loading Screen (if applicable)
  if (enabled) {
    delayLoadingScreen(status);
  }
  
  return { status, res, queryKey, responseKey, requestParams };
};

export default callRequestTiles;
