import { apiBasePromise } from '../../../utils/apiBase';

export interface PlaceDetailResponse {
  id: string;
  display_name: string;
  lat: number;
  lon: number;
  cuisine_type: string | null;
  venue_type: string | null;
  cost: string | null;
  is_chain: boolean | null;
  primary_type: string | null;
  type_label: string | null;
  rating: number | null;
  user_rating_count: number | null;
  score_0: number | null;
  rank_0: number | null;
  score_1: number | null;
  rank_1: number | null;
  score_2: number | null;
  rank_2: number | null;
  wscore_0: number | null;
  wrank_0: number | null;
  wscore_1: number | null;
  wrank_1: number | null;
  wscore_2: number | null;
  wrank_2: number | null;
  operational: boolean | null;
  address: string | null;
  postcode: string | null;
  area_code: string | null;
  google_maps_uri: string | null;
  website_uri: string | null;
  wheelchair_access: boolean | null;
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
