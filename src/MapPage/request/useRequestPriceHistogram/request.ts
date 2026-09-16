import { apiBasePromise } from '../../../utils/apiBase';
import { appendFilterQueryParams } from '../params/appendFilterQueryParams';
import { appendSearchMaskQueryParams, type SearchMaskRequestParams } from '../params/buildSearchMaskParams';

export interface CostHistogramEntry {
  cost: string;
  count: number;
}
export type PriceHistogramScope = 'view' | 'nearby' | 'citywide';

export interface PriceHistogramParams extends SearchMaskRequestParams {
  scope: PriceHistogramScope;
  city?: string;
  lat?: number;
  lng?: number;
  radius_m?: number;
  sw_lat?: number;
  sw_lng?: number;
  ne_lat?: number;
  ne_lng?: number;
  cuisines?: string[];
  venue_type?: string;
  score_basis?: 0 | 1 | 2;
  score_tier?: 0 | 1 | 2 | 3 | 4;
}

export interface PriceHistogramResponse {
  cost_histogram: CostHistogramEntry[];
}

export const buildQueryKey = (params: PriceHistogramParams): string => {
  const qs = new URLSearchParams();
  qs.set('city', params.city ?? 'london');
  qs.set('scope', params.scope);
  appendFilterQueryParams(qs, params);

  if (params.scope === 'view') {
    qs.set('sw_lat', String(params.sw_lat));
    qs.set('sw_lng', String(params.sw_lng));
    qs.set('ne_lat', String(params.ne_lat));
    qs.set('ne_lng', String(params.ne_lng));
  } else if (params.scope === 'nearby') {
    appendSearchMaskQueryParams(qs, params);
  }

  return qs.toString();
};

export const request = async (
  queryKey: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<PriceHistogramResponse> => {
  const API_BASE = await apiBasePromise;
  const res = await fetch(`${API_BASE}/api/cost_histogram?${queryKey}`, { signal });
  if (!res.ok) {
    throw new Error(`Failed to fetch /api/cost_histogram: ${res.status} ${res.statusText}`);
  }
  const payload: unknown = await res.json();
  if (typeof payload !== 'object' || payload === null || !('cost_histogram' in payload)) {
    throw new Error('Invalid /api/cost_histogram response shape.');
  }
  return payload as PriceHistogramResponse;
};
