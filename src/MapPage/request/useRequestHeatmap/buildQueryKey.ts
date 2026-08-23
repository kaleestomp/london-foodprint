import type { HeatmapParams } from './useRequestHeatmap';

const buildQueryKey = (params: HeatmapParams): string => {
  const query = new URLSearchParams();

  if (params.sw_lat != null) query.set('sw_lat', String(params.sw_lat));
  if (params.sw_lng != null) query.set('sw_lng', String(params.sw_lng));
  if (params.ne_lat != null) query.set('ne_lat', String(params.ne_lat));
  if (params.ne_lng != null) query.set('ne_lng', String(params.ne_lng));

  query.set('venue_type', params.venue_type ?? '');
  query.set('score_basis', String(params.score_basis ?? 0));
  query.set('score_tier', String(params.score_tier ?? 0));

  for (const cost of [...(params.cost ?? [])].sort((left, right) => left.localeCompare(right))) {
    query.append('cost', cost);
  }

  for (const cuisine of [...(params.cuisines ?? [])].sort((left, right) => left.localeCompare(right))) {
    query.append('cuisine', cuisine);
  }

  return query.toString();
};

export default buildQueryKey;
