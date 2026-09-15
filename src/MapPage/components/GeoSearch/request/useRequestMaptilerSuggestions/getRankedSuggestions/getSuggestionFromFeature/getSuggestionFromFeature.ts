import type { GeoSuggestion, MaptilerFeature } from '../../../../types';
import BOUNDARY_PLACE_TYPES from './BoundaryPlaceTypes';
import STREET_QUERY_KEYWORDS from './StreetQueryKeyWords';

export const getSuggestionFromFeature = (
  feature: MaptilerFeature, 
  query = ''
): GeoSuggestion => {
  
  const placeTypes = feature.place_type ?? [];
  const kind = feature.properties?.kind;
  const expectsBoundary = placeTypes.some((t) => BOUNDARY_PLACE_TYPES.has(t));
  const expectsStreet = kind === 'street' || placeTypes.includes('road');
  const expectsPlace = !expectsBoundary 
    && (!expectsStreet || !STREET_QUERY_KEYWORDS.test(query));

  return {
    id: feature.id,
    primary: feature.text,
    secondary: toSecondary(feature),
    placeTypes,
    center: toCenter(feature),
    expectsBoundary,
    expectsPlace,
    expectsStreet,
  };
};

export default getSuggestionFromFeature;

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