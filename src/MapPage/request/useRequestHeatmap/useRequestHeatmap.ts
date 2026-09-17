import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useCityContext } from '../../../context/CityContext';
import buildQueryKey from './buildQueryKey';
import { type HeatmapResponse, request } from './request';
import { getRequestStatus, type RequestStatus } from '../../../utils/requestStatus';

export type HeatmapParams = {
  city?: string;
  sw_lat?: number;
  sw_lng?: number;
  ne_lat?: number;
  ne_lng?: number;
  cuisines?: string[];
  cost?: string[];
  venue_type?: string;
  score_basis?: 0 | 1 | 2;
  wilson_basis?: 0 | 1 | 2;
  score_tier?: 0 | 1 | 2 | 3 | 4;
};

type UseRequestHeatmapResult = {
  status: RequestStatus;
  error: Error | null;
  res: HeatmapResponse | null;
  queryKey: string;
  isPlaceholderData: boolean;
  isFetching: boolean;
};

const useRequestHeatmap = (params: HeatmapParams | null): UseRequestHeatmapResult => {
  const { citySlug: city } = useCityContext();
  const queryKey = useMemo(() => (params ? buildQueryKey({ ...params, city }) : ''), [params, city]);
  const query = useQuery({
    queryKey: ['heatmap', queryKey],
    queryFn: ({ signal }) => request(queryKey, { signal }),
    enabled: Boolean(queryKey),
    staleTime: Infinity,
    placeholderData: (previousData) => previousData,
  });

  const status = getRequestStatus({ enabled: Boolean(queryKey), isPending: query.isPending, isFetching: query.isFetching, isError: query.isError, hasData: Boolean(query.data) });

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
