const API_BASE =
  (import.meta.env as Record<string, string | undefined>).VITE_API_BASE_URL ??
  'http://localhost:3000';

export interface TileDensity {
  tile: string;
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
  | { mode: 'tiles'; resolution: number; data: TileDensity[] }
  | { mode: 'places'; total: number; data: TilePlacePreview[] };

export const request = async (
  queryKey: string,
  { signal }: { signal?: AbortSignal } = {}
): Promise<TilesResponse> => {
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
