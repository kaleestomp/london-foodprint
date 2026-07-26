import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type PriceHistogramParams, type PriceHistogramResponse, buildQueryKey, request } from './request';

export type RequestStatus = 'empty' | 'loading' | 'success' | 'error';

const useRequestPriceHistogram = (params: PriceHistogramParams | null): {
  status: RequestStatus;
  error: Error | null;
  res: PriceHistogramResponse | null;
} => {
  const queryKey = useMemo(() => (params ? buildQueryKey(params) : ''), [params]);

  const query = useQuery({
    queryKey: ['price-histogram', queryKey],
    queryFn: ({ signal }) => request(queryKey, { signal }),
    enabled: Boolean(queryKey),
    // Keep the last successful histogram visible while the next viewport query is in flight.
    placeholderData: (previousData) => previousData,
  });

  const status: RequestStatus = !queryKey
    ? 'empty'
    : query.isPending || (query.isFetching && !query.data)
      ? 'loading'
      : query.isError
        ? 'error'
        : query.data
          ? 'success'
          : 'empty';

  return {
    status,
    error: query.error as Error | null,
    res: query.data ?? null,
  };
};

export default useRequestPriceHistogram;