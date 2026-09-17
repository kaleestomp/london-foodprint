import requestFeatureList from '../requestFeatureList';
import getSuggestionFromFeature from './getSuggestionFromFeature/getSuggestionFromFeature';
import isPointInGeoJSON from '../../../../../../utils/geo/isPointInGeoJSON';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

type CityBoundary = FeatureCollection | Feature | Geometry | null;

const getRankedSuggestions = (
  features: Awaited<ReturnType<typeof requestFeatureList>>,
  query: string,
  cityBoundary?: CityBoundary,
) => {

  // PARSE SUGGESTIONS FROM RETURNED FEATURES
  const items = features
    // MapTiler's centre is [longitude, latitude], matching GeoJSON positions.
    // Keep features without a centre so boundary/street selections can still
    // be resolved by their feature ID in the selection flow.
    .filter((feature) => (
      !feature.center || isPointInGeoJSON(feature.center, cityBoundary ?? null)
    ))
    .map((feature) => getSuggestionFromFeature(feature, query))
    .filter((item) => item.center !== null || item.expectsBoundary);

  // Do not override MapTiler's response order. Its ranking includes query
  // similarity, proximity, and other provider-side relevance signals.
  // const rank = (item: GeoSuggestion) => (
  //   item.expectsBoundary ? 0
  //   : item.expectsPlace ? 1 : 2
  // );
  // const suggestionsRanked = items.sort((a, b) => (
  //   rank(a) - rank(b)
  // ));

  return items;
};

export default getRankedSuggestions;