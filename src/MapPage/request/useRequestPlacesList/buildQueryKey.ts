import { type PlacesListParams } from './useRequestPlacesList';

export const buildQueryKey = (
  params: PlacesListParams | null,
  page?: number,
): string => {

  if (!params) return '';
  if ('enabled' in params && params.enabled === false) return '';

  // NON-PAGED
  const qs = new URLSearchParams({
    sw_lat: String(params.sw_lat),
    sw_lng: String(params.sw_lng),
    ne_lat: String(params.ne_lat),
    ne_lng: String(params.ne_lng),
    venue_type: params.venue_type ?? '',
    score_basis: String(params.score_basis ?? 0),
    score_tier: String(params.score_tier ?? 0),
  });

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

  for (const cost of [...(params.cost ?? [])].sort((a, b) => a.localeCompare(b))) {
    qs.append('cost', cost);
  }
  for (const cuisine of [...(params.cuisines ?? [])].sort((a, b) => a.localeCompare(b))) {
    qs.append('cuisine', cuisine);
  }

  return qs.toString();
};

export default buildQueryKey;