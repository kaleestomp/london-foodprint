import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type NearbyResponse, request } from './request';

type RequestStatus = 'empty' | 'loading' | 'success' | 'error';

export interface NearbyParams {
  lat: number;
  lng: number;
  radius_m?: number;
  cuisines?: string[];
  cost?: string[];
  venue_type?: string;
  score_basis?: 0 | 1 | 2;
  score_tier?: 0 | 1 | 2 | 3 | 4;
  page?: number;
}

const buildQueryKey = (params: NearbyParams): string => {
  const qs = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    radius_m: String(params.radius_m ?? 1000),
    venue_type: params.venue_type ?? '',
    score_basis: String(params.score_basis ?? 0),
    score_tier: String(params.score_tier ?? 0),
    page: String(params.page ?? 1),
  });

  for (const cost of [...(params.cost ?? [])].sort((left, right) => left.localeCompare(right))) {
    qs.append('cost', cost);
  }

  for (const cuisine of [...(params.cuisines ?? [])].sort((left, right) => left.localeCompare(right))) {
    qs.append('cuisine', cuisine);
  }

  return qs.toString();
};

const useRequestNearby = (params: NearbyParams | null): {
  status: RequestStatus;
  error: Error | null;
  res: NearbyResponse | null;
  queryKey: string;
  responseKey: string;
  isFetching: boolean;
} => {
  const queryKey = useMemo(() => (params ? buildQueryKey(params) : ''), [params]);

  const query = useQuery({
    queryKey: ['nearby', queryKey],
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
    responseKey: query.data ? queryKey : '',
    isFetching: query.isFetching,
  };
};

export default useRequestNearby;
