import { type TilesParams } from './useRequestTiles';

const buildQueryKey = (params: TilesParams): string => {
  
  const qs = new URLSearchParams({
    sw_lat: String(params.sw_lat),
    sw_lng: String(params.sw_lng),
    ne_lat: String(params.ne_lat),
    ne_lng: String(params.ne_lng),
    res: String(params.res),
    ...(params.places_only ? { places_only: 'true' } : {}),
    venue_type: params.venue_type ?? '',
    score_basis: String(params.score_basis ?? 0),
    score_tier: String(params.score_tier ?? 0),
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