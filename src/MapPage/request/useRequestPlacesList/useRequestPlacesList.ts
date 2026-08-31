import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type PlacesListResponse, request } from './request';
import type { PlacesListParams } from '../useRequestPlacesList/useRequestInfinitePlacesList';
import { DEFAULT_PAGE_SIZE } from '../useRequestPlacesList/useRequestInfinitePlacesList';
type RequestStatus = 'empty' | 'loading' | 'success' | 'error';

export const buildQueryKey = (params: PlacesListParams): string => {
  const qs = new URLSearchParams({
    sw_lat: String(params.sw_lat),
    sw_lng: String(params.sw_lng),
    ne_lat: String(params.ne_lat),
    ne_lng: String(params.ne_lng),
    venue_type: params.venue_type ?? '',
    score_basis: String(params.score_basis ?? 0),
    page_size: String(params.page_size ?? DEFAULT_PAGE_SIZE),
    page: String(params.page ?? 1),
  });

  if (
    typeof params.center_lat === 'number'
    && typeof params.center_lng === 'number'
    && typeof params.radius_m === 'number'
  ) {
    qs.set('center_lat', String(params.center_lat));
    qs.set('center_lng', String(params.center_lng));
    qs.set('radius_m', String(params.radius_m));
  }

  for (const cost of [...(params.cost ?? [])].sort((a, b) => a.localeCompare(b))) {
    qs.append('cost', cost);
  }
  for (const cuisine of [...(params.cuisines ?? [])].sort((a, b) => a.localeCompare(b))) {
    qs.append('cuisine', cuisine);
  }

  return qs.toString();
};

const useRequestPlacesList = (params: PlacesListParams | null): {
  status: RequestStatus;
  error: Error | null;
  res: PlacesListResponse | null;
} => {
  const queryKey = useMemo(() => {
    if (!params || params.enabled === false) return '';
    return buildQueryKey(params);
  }, [params]);

  const query = useQuery({
    queryKey: ['places-list', queryKey],
    queryFn: ({ signal }) => request(queryKey, { signal }),
    enabled: Boolean(queryKey),
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

  return { status, error: query.error as Error | null, res: query.data ?? null };
};

export default useRequestPlacesList;
