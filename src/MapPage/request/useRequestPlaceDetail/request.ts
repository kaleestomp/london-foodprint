import { apiBasePromise } from '../../../utils/apiBase';

export interface PlaceDetailResponse {
  id: string;
  ranking: number | null;
  display_name: string;
  cuisine_type: string | null;
  is_chain: boolean | null;
  venue_type: string | null;
  google_maps_uri: string | null;
  website_uri: string | null;
  short_formatted_address: string | null;
  pcd: string | null;
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
