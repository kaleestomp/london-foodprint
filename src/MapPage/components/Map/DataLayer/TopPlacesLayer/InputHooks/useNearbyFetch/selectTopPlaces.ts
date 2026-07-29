import { type TopPlaceItem } from '../../../../../../request/useRequestTopPlaces/request';
import { type NearbyPlace } from '../../../../../../request/useRequestNearby/request';

const selectTopPlaces = (
  places: readonly NearbyPlace[],
  limit = 10,
): TopPlaceItem[] => {
  if (!Array.isArray(places) || places.length === 0 || limit <= 0) {
    return [];
  }

  const normalized = places.map((place: NearbyPlace) => ({
    id: place.id,
    restaurant_name: null,
    cuisine_type: null,
    lat: place.lat,
    lon: place.lon,
    normal_1: null,
    rank: place.rank,
  }));

  const topPlaces = normalized.sort((left, right) => {
    const leftRank = left.rank;
    const rightRank = right.rank;

    if (leftRank == null && rightRank == null) return left.id.localeCompare(right.id);
    if (leftRank == null) return 1;
    if (rightRank == null) return -1;

    if (rightRank !== leftRank) return rightRank - leftRank;
    return left.id.localeCompare(right.id);
  })
    .slice(0, limit);

  return topPlaces;
};

export default selectTopPlaces;