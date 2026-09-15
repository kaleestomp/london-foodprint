import type { MaptilerFeature, MaptilerGeocodeResponse } from '../../types';

const MAPTILER_KEY = (import.meta.env as Record<string, string | undefined>).VITE_MAPTILER_KEY;
const GEOCODING_BASE = 'https://api.maptiler.com/geocoding';

/**
 * Fetch a feature by its id to obtain full geometry. Administrative features
 * return Polygon/MultiPolygon geometry; address-like features return Points.
 */
export const requestFeatureGeometry = async (
  id: string,
  signal?: AbortSignal,
): Promise<MaptilerFeature | null> => {
  if (!MAPTILER_KEY) { return null; }

  const params = new URLSearchParams({ key: MAPTILER_KEY });
  const url = `${GEOCODING_BASE}/${encodeURIComponent(id)}.json?${params.toString()}`;
  const res = await fetch(url, { signal });
  if (!res.ok) { throw new Error(`MapTiler feature lookup error: ${res.status}`); }
  const data: MaptilerGeocodeResponse = await res.json();
  return data.features?.[0] ?? null;
};

export default requestFeatureGeometry;