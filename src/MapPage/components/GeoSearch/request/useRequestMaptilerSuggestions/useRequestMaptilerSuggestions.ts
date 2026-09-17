import { useQuery } from '@tanstack/react-query';

import { useCityContext } from '../../../../../context/CityContext';
import { useViewportQuery } from '../../../../../context/ViewportQueryContext';
import requestFeatureList from './requestFeatureList';
import { getRequestStatus } from '../../../../../utils/requestStatus';
import getRankedSuggestions from './getRankedSuggestions/getRankedSuggestions';
import useDebounceQuery, { MIN_QUERY_LENGTH } from './useDebounceQuery';

const useRequestMaptilerSuggestions = (query: string) => {

  const { cityParams, cityBoundary } = useCityContext();
  const { viewportParams } = useViewportQuery();
  const debouncedQuery = useDebounceQuery(query);

  // Prefer the visible map area when available. Fall back to the city centre
  // before the map has reported its first viewport.
  const refPoint: [number, number] = viewportParams
    ? [
        (viewportParams.sw_lng + viewportParams.ne_lng) / 2,
        (viewportParams.sw_lat + viewportParams.ne_lat) / 2,
      ]
    : cityParams.center;
  const maxBound = cityParams.dataBound;

  const queryResult = useQuery({
    queryKey: ['maptiler-suggestions', refPoint, debouncedQuery] as const,
    queryFn: ({ signal }) => requestFeatureList(debouncedQuery, refPoint, maxBound, signal),
    enabled: debouncedQuery.length >= MIN_QUERY_LENGTH,
    select: (features) => getRankedSuggestions(features, debouncedQuery, cityBoundary),
    staleTime: 30_000,
    gcTime: 2 * 60_000,
    retry: false,
  });

  const status = getRequestStatus({
    enabled: Boolean(debouncedQuery),
    isPending: queryResult.isPending,
    isFetching: queryResult.isFetching,
    isError: queryResult.isError,
    hasData: Boolean(queryResult.data),
  });

  // STALE RESULTS FROM A PREVIOUS QUERY 
  // ARE NEVER EXPOSED FOR SHORT QUERIES.
  const exposed = (query.trim().length >= MIN_QUERY_LENGTH) 
    ? (queryResult.data ?? []) : [];
  
  return {
    status,
    error: queryResult.error as Error | null,
    suggestions: exposed,
    isFetching: queryResult.isFetching,
  };
};

export default useRequestMaptilerSuggestions;
