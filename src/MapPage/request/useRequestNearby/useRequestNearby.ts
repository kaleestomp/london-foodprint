import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCityContext } from '../../../context/CityContext';
import { type NearbyResponse, request } from './request';
import { getRequestStatus, type RequestStatus } from '../../../utils/requestStatus';
import { appendFilterQueryParams } from '../params/appendFilterQueryParams';


export interface NearbyParams {
  city?: string;
  lat: number;
  lng: number;
  radius_m?: number;
  cuisines?: string[];
  cost?: string[];
  venue_type?: string;
  score_basis?: 0 | 1 | 2;
  wilson_basis?: 0 | 1 | 2;
  score_tier?: 0 | 1 | 2 | 3 | 4;
  page?: number;
}

const buildQueryKey = (params: NearbyParams): string => {
  const qs = new URLSearchParams({
    city: params.city ?? 'london',
    lat: String(params.lat),
    lng: String(params.lng),
    radius_m: String(params.radius_m ?? 1000),
    page: String(params.page ?? 1),
  });
  appendFilterQueryParams(qs, params);

  return qs.toString();
};

const useRequestNearby = (params: NearbyParams | null): {
  status: RequestStatus;
  error: Error | null;
  res: NearbyResponse | null;
  queryKey: string;
  isPlaceholderData: boolean;
  isFetching: boolean;
} => {
  const { citySlug: city } = useCityContext();
  const queryKey = useMemo(() => (params ? buildQueryKey({ ...params, city }) : ''), [params, city]);

  const query = useQuery({
    queryKey: ['nearby', queryKey],
    queryFn: ({ signal }) => request(queryKey, { signal }),
    enabled: Boolean(queryKey),
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

export default useRequestNearby;
