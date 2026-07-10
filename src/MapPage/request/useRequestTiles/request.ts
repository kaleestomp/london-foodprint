import { apiBasePromise } from '../../../utils/apiBase';

export interface TileDensity {
  tile: string;
  count: number;
  singleton?: { id: string; lat: number; lon: number } | null;
}
export interface TilePlacePreview {
  id: string;
  lat: number;
  lon: number;
  tier: number | null;
}
export type TilesResponse =
  | { mode: 'tiles'; resolution: number; data: TileDensity[] }
  | { mode: 'places'; total: number; data: TilePlacePreview[] };

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
