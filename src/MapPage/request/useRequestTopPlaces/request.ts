import { apiBasePromise } from '../../../utils/apiBase';

export interface TopPlaceItem {
  id: string;
  restaurant_name: string | null;
  cuisine_type: string | null;
  lat: number;
  lon: number;
  normal_1: number | null;
  rank: number | null;
}

export interface TopPlacesResponse {
  data: TopPlaceItem[];
  total: number;
  limit: number;
}

export const request = async (
  queryKey: string,
  { signal }: { signal?: AbortSignal } = {}
): Promise<TopPlacesResponse> => {
  const API_BASE = await apiBasePromise;
  const res: Response = await fetch(`${API_BASE}/api/places/top?${queryKey}`, { signal });
  if (!res.ok) {
    throw new Error(`Failed to fetch /api/places/top: ${res.status} ${res.statusText}`);
  }

  const payload: unknown = await res.json();
  if (typeof payload !== 'object' || payload === null || !('data' in payload)) {
    throw new Error('Invalid /api/places/top response shape.');
  }

  return payload as TopPlacesResponse;
};
