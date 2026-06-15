import { apiBasePromise } from '../../../utils/apiBase';

export interface PlaceDetailResponse {
  id: string;
  display_name: string;
  primary_type_display_name: string | null;
  rating: number | null;
  user_rating_count: number | null;
  short_formatted_address: string | null;
  google_maps_uri: string | null;
  website_uri: string | null;
  types: string | null;
  primary_type: string | null;
  is_chain: boolean | null;
  predicted_type: string | null;
  cuisine_type: string | null;
  venue_type: string | null;
  lat: number;
  lon: number;
  h3_r10: string;
  pcd: string | null;
  areacode: string | null;
  wheelchair_access: boolean | null;
  operational: boolean | null;
  cost: string | null;
  wilson_1: number | null;
  normal_1: number | null;
  tier: number | null;
  tier_d: number | null;
  tier_independent: number | null;
}

export const request = async (
  placeId: string,
  { signal }: { signal?: AbortSignal } = {}
): Promise<PlaceDetailResponse> => {
  const API_BASE = await apiBasePromise;
  const res: Response = await fetch(`${API_BASE}/api/place/${encodeURIComponent(placeId)}`, { signal });
  if (!res.ok) {
    throw new Error(`Failed to fetch /api/place/${placeId}: ${res.status} ${res.statusText}`);
  }

  const payload: unknown = await res.json();
  if (typeof payload !== 'object' || payload === null || !('id' in payload)) {
    throw new Error('Invalid /api/place response shape.');
  }

  return payload as PlaceDetailResponse;
};
