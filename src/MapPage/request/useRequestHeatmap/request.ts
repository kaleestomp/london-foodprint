import { apiBasePromise } from '../../../utils/apiBase';

export interface HeatmapCoordinate {
  id: string;
  lat: number;
  lng: number;
  cuisine_type: string | null;
}

export interface HeatmapResponse {
  data: HeatmapCoordinate[];
  total: number;
}

export const request = async (
  queryKey: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<HeatmapResponse> => {
  const API_BASE = await apiBasePromise;
  const response = await fetch(`${API_BASE}/api/heatmap?${queryKey}`, { signal });
  if (!response.ok) {
    throw new Error(`Failed to fetch /api/heatmap: ${response.status} ${response.statusText}`);
  }

  const payload: unknown = await response.json();
  if (typeof payload !== 'object' || payload === null || !('data' in payload)) {
    throw new Error('Invalid /api/heatmap response shape.');
  }

  return payload as HeatmapResponse;
};
