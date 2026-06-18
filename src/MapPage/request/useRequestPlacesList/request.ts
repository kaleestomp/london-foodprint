import { apiBasePromise } from '../../../utils/apiBase';

export interface PlacesListItem {
  ranking: number | null;
  display_name: string;
  cuisine_type: string | null;
  is_chain: boolean | null;
  venue_type: string | null;
  google_maps_uri: string | null;
  website_uri: string | null;
}

export interface PlacesListResponse {
  page: number;
  page_size: number;
  data: PlacesListItem[];
}

export const request = async (
  queryKey: string,
  { signal }: { signal?: AbortSignal } = {}
): Promise<PlacesListResponse> => {
  const API_BASE = await apiBasePromise;
  const res: Response = await fetch(`${API_BASE}/api/places/list?${queryKey}`, { signal });
  if (!res.ok) {
    throw new Error(`Failed to fetch /api/places/list: ${res.status} ${res.statusText}`);
  }

  const payload: unknown = await res.json();
  if (typeof payload !== 'object' || payload === null || !('data' in payload)) {
    throw new Error('Invalid /api/places/list response shape.');
  }

  return payload as PlacesListResponse;
};
