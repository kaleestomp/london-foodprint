import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type PlacesListResponse, request } from './request';
import { useCityContext } from '../../../context/CityContext';
import type { PlacesListParams } from '../useRequestPlacesList/useRequestInfinitePlacesList';
import { DEFAULT_PAGE_SIZE } from '../useRequestPlacesList/useRequestInfinitePlacesList';
import { getRequestStatus, type RequestStatus } from '../../../utils/requestStatus';

export const buildQueryKey = (params: PlacesListParams): string => {
  const qs = new URLSearchParams({
    city: params.city ?? 'london',
    venue_type: params.venue_type ?? '',
    score_basis: String(params.score_basis ?? 0),
    wilson_basis: String(params.wilson_basis ?? 1),
    page_size: String(params.page_size ?? DEFAULT_PAGE_SIZE),
    page: String(params.page ?? 1),
  });

  for (const [key, value] of [
    ['sw_lat', params.sw_lat], ['sw_lng', params.sw_lng],
    ['ne_lat', params.ne_lat], ['ne_lng', params.ne_lng],
    ['center_lat', params.center_lat], ['center_lng', params.center_lng],
    ['radius_m', params.radius_m], ['search_type', params.search_type],
  ] as const) {
    if (value != null) qs.set(key, String(value));
  }

  if (params.geometry != null) qs.set('geometry', JSON.stringify(params.geometry));

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
  const { citySlug: city } = useCityContext();
  const queryKey = useMemo(() => {
    if (!params || params.enabled === false) return '';
    return buildQueryKey({ ...params, city });
  }, [params, city]);

  const query = useQuery({
    queryKey: ['places-list', queryKey],
    queryFn: ({ signal }) => request(queryKey, { signal }),
    enabled: Boolean(queryKey),
  });

  const status = getRequestStatus({ enabled: Boolean(queryKey), isPending: query.isPending, isFetching: query.isFetching, isError: query.isError, hasData: Boolean(query.data) });

  return { status, error: query.error as Error | null, res: query.data ?? null };
};

export default useRequestPlacesList;
