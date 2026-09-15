import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCityContext } from '../../../context/CityContext';
import { type CuisineHistogramParams, type CuisineHistogramResponse, buildQueryKey, request } from './request';
import { getRequestStatus, type RequestStatus } from '../../../utils/requestStatus';

const useRequestCuisineHistogram = (params: CuisineHistogramParams | null): {
  status: RequestStatus;
  error: Error | null;
  res: CuisineHistogramResponse | null;
} => {
  const { citySlug: city } = useCityContext();
  const queryKey = useMemo(() => (params ? buildQueryKey({ ...params, city }) : ''), [params, city]);

  const query = useQuery({
    queryKey: ['cuisine-histogram', queryKey],
    queryFn: ({ signal }) => request(queryKey, { signal }),
    enabled: Boolean(queryKey),
    // Keep the last successful histogram visible while the next viewport query is in flight.
    placeholderData: (previousData) => previousData,
  });

  const status = getRequestStatus({ enabled: Boolean(queryKey), isPending: query.isPending, isFetching: query.isFetching, isError: query.isError, hasData: Boolean(query.data) });

  return {
    status,
    error: query.error as Error | null,
    res: query.data ?? null,
  };
};

export default useRequestCuisineHistogram;