import requestFeatureList from '../requestFeatureList';
import getSuggestionFromFeature from './getSuggestionFromFeature/getSuggestionFromFeature';
import type { GeoSuggestion } from '../../../types';

const getRankedSuggestions = (
  features: Awaited<ReturnType<typeof requestFeatureList>>, 
  query: string
) => {

  // PARSE SUGGESTIONS FROM RETURNED FEATURES
  const items = features
    .map((feature) => getSuggestionFromFeature(feature, query))
    .filter((item) => item.center !== null || item.expectsBoundary);

  // SORT SUGGESTIONS BY EXPECTED TYPE PRIORITY
  const rank = (item: GeoSuggestion) => (
    item.expectsBoundary ? 0 
    : item.expectsPlace ? 1 : 2
  );
  const suggestionsRanked = items.sort((a, b) => (
    rank(a) - rank(b)
  ));

  return suggestionsRanked;
};

export default getRankedSuggestions;