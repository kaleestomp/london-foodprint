import { apiBasePromise } from '../../../utils/apiBase';

export interface OpeningTime {
  open_minute: number;
  close_minute: number;
}

export interface PlaceDetailResponse {
  id: string;
  lat: number;
  lon: number;
  ranking: number | null;
  display_name: string;
  cuisine_type: string | null;
  price: string | null;
  local_rep_ratio: number | null;
  local_total: number | null;
  rep_delta: number | null;
  pcd: string | null;
  chain_count: number | null;
  chain_name: string | null;
  is_chain: boolean | null;
  is_major_chain: boolean | null;
  venue_type: string | null;
  google_maps_uri: string | null;
  website_uri: string | null;
  short_formatted_address: string | null;
  review_count: number | null;
  opening_time: OpeningTime | null;
}

export const request = async (
  placeId: string,
  { signal, city }: { signal?: AbortSignal; city?: string } = {}
): Promise<PlaceDetailResponse> => {
  const API_BASE = await apiBasePromise;
  const qs = city ? `?city=${encodeURIComponent(city)}` : '';
  const res: Response = await fetch(`${API_BASE}/api/place/${encodeURIComponent(placeId)}${qs}`, { signal });
  if (!res.ok) {
    throw new Error(`Failed to fetch /api/place/${placeId}: ${res.status} ${res.statusText}`);
  }

  const payload: unknown = await res.json();
  if (typeof payload !== 'object' || payload === null || !('id' in payload)) {
    throw new Error('Invalid /api/place response shape.');
  }

  return payload as PlaceDetailResponse;
};
