import { type PlacesListParams, DEFAULT_PAGE_SIZE } from './useRequestInfinitePlacesList';
import { appendFilterQueryParams } from '../params/appendFilterQueryParams';

export const buildQueryKey = (
  params: PlacesListParams | null,
  page?: number,
): string => {

  if (!params) return '';
  if ('enabled' in params && params.enabled === false) return '';

  // NON-PAGED
  const qs = new URLSearchParams({
    city: params.city ?? 'london',
    sw_lat: String(params.sw_lat),
    sw_lng: String(params.sw_lng),
    ne_lat: String(params.ne_lat),
    ne_lng: String(params.ne_lng),
    page_size: String(params.page_size ?? DEFAULT_PAGE_SIZE),
  });
  const { score_tier: _, ...filterParams } = params;
  appendFilterQueryParams(qs, filterParams);

  if (typeof page === 'number') {
    qs.set('page', String(page));
  }

  if (
    typeof params.center_lat === 'number'
    && typeof params.center_lng === 'number'
    && typeof params.radius_m === 'number'
  ) {
    qs.set('center_lat', String(params.center_lat));
    qs.set('center_lng', String(params.center_lng));
    qs.set('radius_m', String(params.radius_m));
  }

  return qs.toString();
};

export default buildQueryKey;