import type { HeatmapParams } from './useRequestHeatmap';
import { appendFilterQueryParams } from '../params/appendFilterQueryParams';

const buildQueryKey = (params: HeatmapParams): string => {
  
  const query = new URLSearchParams();

  query.set('city', params.city ?? 'london');
  if (params.sw_lat != null) query.set('sw_lat', String(params.sw_lat));
  if (params.sw_lng != null) query.set('sw_lng', String(params.sw_lng));
  if (params.ne_lat != null) query.set('ne_lat', String(params.ne_lat));
  if (params.ne_lng != null) query.set('ne_lng', String(params.ne_lng));

  appendFilterQueryParams(query, params);

  return query.toString();
};

export default buildQueryKey;
