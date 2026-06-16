import { apiBasePromise } from '../../../utils/apiBase';

export interface TileDensity {
  tile: string;
  count: number;
}

export interface CostHistogramEntry {
  cost: string;
  count: number;
}

export interface TilePlacePreview {
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

export type TilesResponse =
  | { mode: 'tiles'; resolution: number; data: TileDensity[]; cost_histogram?: CostHistogramEntry[] }
  | { mode: 'places'; total: number; data: TilePlacePreview[]; cost_histogram?: CostHistogramEntry[] };

export const request = async (
  queryKey: string,
  { signal }: { signal?: AbortSignal } = {}
): Promise<TilesResponse> => {
  const API_BASE = await apiBasePromise;
  const res: Response = await fetch(`${API_BASE}/api/tiles?${queryKey}`, { signal });
  if (!res.ok) {
    throw new Error(`Failed to fetch /api/tiles: ${res.status} ${res.statusText}`);
  }

  const payload: unknown = await res.json();
  if (typeof payload !== 'object' || payload === null || !('mode' in payload)) {
    throw new Error('Invalid /api/tiles response shape.');
  }

  return payload as TilesResponse;
};
