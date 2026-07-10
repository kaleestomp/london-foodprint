import type { TopPlacesParams } from './useRequestTopPlaces';

const buildQueryKey = (params: TopPlacesParams): string => {
  const qs = new URLSearchParams({
    sw_lat: String(params.sw_lat),
    sw_lng: String(params.sw_lng),
    ne_lat: String(params.ne_lat),
    ne_lng: String(params.ne_lng),
    res: String(params.res),
    venue_type: params.venue_type ?? '',
    score_basis: String(params.score_basis ?? 0),
    score_tier: String(params.score_tier ?? 0),
    limit: String(params.limit ?? 10),
  });

  for (const cost of [...(params.cost ?? [])].sort((left, right) => left.localeCompare(right))) {
    qs.append('cost', cost);
  }

  for (const cuisine of [...(params.cuisines ?? [])].sort((left, right) => left.localeCompare(right))) {
    qs.append('cuisine', cuisine);
  }

  return qs.toString();
};

export default buildQueryKey;
