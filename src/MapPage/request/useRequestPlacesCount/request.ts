import { apiBasePromise } from '../../../utils/apiBase';

export type PlacesCountScope = 'view' | 'nearby' | 'citywide';

export interface PlacesCountParams {
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
  costs?: string[];
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
  qs.set('venue_type', params.venue_type ?? '');
  qs.set('score_basis', String(params.score_basis ?? 0));
  qs.set('score_tier', String(params.score_tier ?? 0));
  qs.set('requestTierRep', String(params.requestTierRep));

  if (params.scope === 'view') {
    qs.set('sw_lat', String(params.sw_lat));
    qs.set('sw_lng', String(params.sw_lng));
    qs.set('ne_lat', String(params.ne_lat));
    qs.set('ne_lng', String(params.ne_lng));
  } else if (params.scope === 'nearby') {
    qs.set('lat', String(params.lat));
    qs.set('lng', String(params.lng));
    qs.set('radius_m', String(params.radius_m));
  }

  for (const cuisine of (params.cuisines ?? []).slice().sort((a, b) => a.localeCompare(b))) {
    qs.append('cuisine', cuisine);
  }
  for (const cost of (params.costs ?? []).slice().sort((a, b) => a.localeCompare(b))) {
    qs.append('cost', cost);
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