import type { CityParams } from '../../../../../context/CityContext';
import type { MaptilerFeature, MaptilerGeocodeResponse } from '../../types';

const MAPTILER_KEY = (import.meta.env as Record<string, string | undefined>).VITE_MAPTILER_KEY;
const GEOCODING_BASE = 'https://api.maptiler.com/geocoding';

// MapTiler tuning (per https://docs.maptiler.com/server/api/geocoding/):
// - autocomplete=true: search-as-you-type suggestions
// - bbox: strict fence to the active city bounds
// - proximity: bias results towards the city centre (magnet, not a fence)
// - country=gb + language=en: UK address parsing hints
const RESULT_LIMIT = 8;

const requestFeatureList = async (
  query: string,
  cityParams: CityParams | null,
  signal: AbortSignal,
): Promise<MaptilerFeature[]> => {

  if (!MAPTILER_KEY) {
    console.warn('VITE_MAPTILER_KEY is not set; geo search disabled.');
    return [];
  }

  const params = new URLSearchParams({
    key: MAPTILER_KEY,
    autocomplete: 'true',
    fuzzyMatch: 'true',
    limit: String(RESULT_LIMIT),
    language: 'en',
    country: 'gb',
  });

  if (cityParams) {
    const [[west, south], [east, north]] = cityParams.maxBounds;
    params.set('bbox', `${west},${south},${east},${north}`);
    params.set('proximity', `${cityParams.center[0]},${cityParams.center[1]}`);
  }

  const url = `${GEOCODING_BASE}/${encodeURIComponent(query)}.json?${params.toString()}`;
  const res = await fetch(url, { signal });
  if (!res.ok) { throw new Error(`MapTiler geocode error: ${res.status}`); }
  const data: MaptilerGeocodeResponse = await res.json();
  return data.features ?? [];
};

export default requestFeatureList;