import type { TopPlacesParams } from './useRequestTopPlaces';
import { appendFilterQueryParams } from '../params/appendFilterQueryParams';

const buildQueryKey = (params: TopPlacesParams): string => {
  const qs = new URLSearchParams();

  qs.set('city', params.city ?? 'london');
  if (params.sw_lat != null) qs.set('sw_lat', String(params.sw_lat));
  if (params.sw_lng != null) qs.set('sw_lng', String(params.sw_lng));
  if (params.ne_lat != null) qs.set('ne_lat', String(params.ne_lat));
  if (params.ne_lng != null) qs.set('ne_lng', String(params.ne_lng));
  if (params.lat != null) qs.set('lat', String(params.lat));
  if (params.lng != null) qs.set('lng', String(params.lng));
  if (params.radius_m != null) qs.set('radius_m', String(params.radius_m));
  if (params.search_type != null) qs.set('search_type', params.search_type);
  if (params.geometry != null) qs.set('geometry', JSON.stringify(params.geometry));
  appendFilterQueryParams(qs, params);
  qs.set('limit', String(params.limit ?? 10));

  return qs.toString();
};

export default buildQueryKey;
