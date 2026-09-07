import type { CityParams } from '../../../../context/CityContext';
import type { GeoSuggestion, MaptilerFeature, MaptilerGeocodeResponse } from '../types';

const MAPTILER_KEY = (import.meta.env as Record<string, string | undefined>).VITE_MAPTILER_KEY;
const GEOCODING_BASE = 'https://api.maptiler.com/geocoding';

// MapTiler tuning (per https://docs.maptiler.com/server/api/geocoding/):
// - autocomplete=true: search-as-you-type suggestions
// - bbox: strict fence to the active city bounds
// - proximity: bias results towards the city centre (magnet, not a fence)
// - country=gb + language=en: UK address parsing hints
const RESULT_LIMIT = 8;

/**
 * Administrative place types whose full geometry may be a boundary polygon.
 * Resolved via the by-id endpoint at selection time; point geometry falls
 * back to the coordinate flow.
 */
const BOUNDARY_PLACE_TYPES = new Set([
  'continental_marine',
  'country',
  'region',
  'subregion',
  'county',
  'district',
  'joint_municipality',
  'municipality',
  'joint_submunicipality',
  'borough',
  'place',
  'neighbourhood',
  'locality',
  'postal_code',
  'postcode',
]);

export const fetchGeocodeSuggestions = async (
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

/**
 * Fetch a feature by its id to obtain full geometry. Administrative features
 * return Polygon/MultiPolygon geometry; address-like features return Points.
 */
export const fetchFeatureGeometry = async (
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

const toSecondary = (feature: MaptilerFeature): string => {
  const placeName = feature.place_name ?? '';
  if (!placeName) { return ''; }
  if (placeName.startsWith(feature.text)) {
    return placeName.slice(feature.text.length).replace(/^,\s*/, '');
  }
  return placeName;
};

const toCenter = (feature: MaptilerFeature): [number, number] | null => {
  if (feature.center) { return feature.center; }
  if (feature.geometry?.type === 'Point') {
    return feature.geometry.coordinates as [number, number];
  }
  return null;
};

export const toSuggestion = (feature: MaptilerFeature): GeoSuggestion => {
  const placeTypes = feature.place_type ?? [];
  const kind = feature.properties?.kind;
  return {
    id: feature.id,
    primary: feature.text,
    secondary: toSecondary(feature),
    placeTypes,
    center: toCenter(feature),
    expectsBoundary: placeTypes.some((t) => BOUNDARY_PLACE_TYPES.has(t)),
    expectsStreet: kind === 'street' || placeTypes.includes('road'),
  };
};

export const isBoundaryGeometry = (feature: MaptilerFeature): boolean =>
  feature.geometry?.type === 'Polygon' || feature.geometry?.type === 'MultiPolygon';

export const isStreetGeometry = (feature: MaptilerFeature): boolean =>
  feature.geometry?.type === 'LineString' || feature.geometry?.type === 'MultiLineString';
