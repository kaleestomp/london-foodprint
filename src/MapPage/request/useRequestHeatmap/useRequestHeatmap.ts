import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import buildQueryKey from './buildQueryKey';
import { type HeatmapResponse, request } from './request';

export type HeatmapParams = {
  sw_lat?: number;
  sw_lng?: number;
  ne_lat?: number;
  ne_lng?: number;
  cuisines?: string[];
  cost?: string[];
  venue_type?: string;
  score_basis?: 0 | 1 | 2;
  score_tier?: 0 | 1 | 2 | 3 | 4;
};

type RequestStatus = 'empty' | 'loading' | 'success' | 'error';

type UseRequestHeatmapResult = {
  status: RequestStatus;
  error: Error | null;
  res: HeatmapResponse | null;
  queryKey: string;
  isPlaceholderData: boolean;
  isFetching: boolean;
};

const useRequestHeatmap = (params: HeatmapParams | null): UseRequestHeatmapResult => {
  const queryKey = useMemo(() => (params ? buildQueryKey(params) : ''), [params]);
  const query = useQuery({
    queryKey: ['heatmap', queryKey],
    queryFn: ({ signal }) => request(queryKey, { signal }),
    enabled: Boolean(queryKey),
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
    queryKey,
    isPlaceholderData: query.isPlaceholderData,
    isFetching: query.isFetching,
  };
};

export default useRequestHeatmap;
