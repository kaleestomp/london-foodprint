import { apiBasePromise } from '../../../utils/apiBase';

export interface NearbyPlace {
  id: string;
  display_name: string;
  lat: number;
  lon: number;
  cuisine_type: string | null;
  venue_type: string | null;
  cost: string | null;
  rating: number | null;
  user_rating_count: number | null;
  operational: boolean | null;
  rank: number | null;
}

export interface NearbyResponse {
  page: number;
  page_size: number;
  data: NearbyPlace[];
}

export const request = async (
  queryKey: string,
  { signal }: { signal?: AbortSignal } = {}
): Promise<NearbyResponse> => {
  const API_BASE = await apiBasePromise;
  const res: Response = await fetch(`${API_BASE}/api/nearby?${queryKey}`, { signal });
  if (!res.ok) {
    throw new Error(`Failed to fetch /api/nearby: ${res.status} ${res.statusText}`);
  }

  const payload: unknown = await res.json();
  if (typeof payload !== 'object' || payload === null || !('data' in payload)) {
    throw new Error('Invalid /api/nearby response shape.');
  }

  return payload as NearbyResponse;
};
