import { apiBasePromise } from '../../../utils/apiBase';
import { appendFilterQueryParams } from '../params/appendFilterQueryParams';
import { appendSearchMaskQueryParams, type SearchMaskRequestParams } from '../params/buildSearchMaskParams';

export type PlacesCountScope = 'view' | 'nearby' | 'citywide';

export interface PlacesCountParams extends SearchMaskRequestParams {
  scope: PlacesCountScope;
  city?: string;
  lat?: number;
  lng?: number;
  radius_m?: number;
  sw_lat?: number;
  sw_lng?: number;
  ne_lat?: number;
  ne_lng?: number;
  cuisines?: string[];
  cost?: string[];
  venue_type?: string;
  score_basis?: 0 | 1 | 2;
  score_tier?: 0 | 1 | 2 | 3 | 4;
  requestTierRep: boolean;
}

export interface PlacesCountResponse {
  count: number;
  tierRep: number | null;
}

export const buildQueryKey = (params: PlacesCountParams): string => {
  const qs = new URLSearchParams();
  qs.set('city', params.city ?? 'london');
  qs.set('scope', params.scope);
  appendFilterQueryParams(qs, params);
  qs.set('requestTierRep', String(params.requestTierRep));

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
): Promise<PlacesCountResponse> => {
  const API_BASE = await apiBasePromise;
  const res = await fetch(`${API_BASE}/api/places/count?${queryKey}`, { signal });
  if (!res.ok) {
    throw new Error(`Failed to fetch /api/places/count: ${res.status} ${res.statusText}`);
  }
  const payload: unknown = await res.json();
  if (
    typeof payload !== 'object' || payload === null
    || !('count' in payload) || !('tierRep' in payload)
    || typeof payload.count !== 'number'
    || (payload.tierRep !== null && typeof payload.tierRep !== 'number')
  ) {
    throw new Error('Invalid /api/places/count response shape.');
  }
  return payload as PlacesCountResponse;
};