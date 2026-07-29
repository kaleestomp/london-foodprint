import type { TopPlacesParams } from './useRequestTopPlaces';

const buildQueryKey = (params: TopPlacesParams): string => {
  const qs = new URLSearchParams();

  if (params.sw_lat != null) qs.set('sw_lat', String(params.sw_lat));
  if (params.sw_lng != null) qs.set('sw_lng', String(params.sw_lng));
  if (params.ne_lat != null) qs.set('ne_lat', String(params.ne_lat));
  if (params.ne_lng != null) qs.set('ne_lng', String(params.ne_lng));
  if (params.lat != null) qs.set('lat', String(params.lat));
  if (params.lng != null) qs.set('lng', String(params.lng));
  if (params.radius_m != null) qs.set('radius_m', String(params.radius_m));
  qs.set('venue_type', params.venue_type ?? '');
  qs.set('score_basis', String(params.score_basis ?? 0));
  qs.set('score_tier', String(params.score_tier ?? 0));
  qs.set('limit', String(params.limit ?? 10));

  for (const cost of [...(params.cost ?? [])].sort((left, right) => left.localeCompare(right))) {
    qs.append('cost', cost);
  }

  for (const cuisine of [...(params.cuisines ?? [])].sort((left, right) => left.localeCompare(right))) {
    qs.append('cuisine', cuisine);
  }

  return qs.toString();
};

export default buildQueryKey;
