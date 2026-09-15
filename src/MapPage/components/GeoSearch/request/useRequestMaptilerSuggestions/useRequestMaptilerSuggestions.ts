import { useQuery } from '@tanstack/react-query';

import { useCityContext } from '../../../../../context/CityContext';
import requestFeatureList from './requestFeatureList';
import { getRequestStatus } from '../../../../../utils/requestStatus';
import getRankedSuggestions from './getRankedSuggestions/getRankedSuggestions';
import useDebounceQuery, { MIN_QUERY_LENGTH } from './useDebounceQuery';

const useRequestMaptilerSuggestions = (query: string) => {

  const { cityParams } = useCityContext();
  const debouncedQuery = useDebounceQuery(query);

  const queryResult = useQuery({
    queryKey: ['maptiler-suggestions', cityParams, debouncedQuery] as const,
    queryFn: ({ signal }) => requestFeatureList(debouncedQuery, cityParams, signal),
    enabled: debouncedQuery.length >= MIN_QUERY_LENGTH,
    select: (features) => getRankedSuggestions(features, debouncedQuery),
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
