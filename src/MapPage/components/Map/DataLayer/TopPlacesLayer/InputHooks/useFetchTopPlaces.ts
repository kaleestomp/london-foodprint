import type { TopPlaceItem } from '../../../../../request/useRequestTopPlaces/request';
import  useViewportFetch from './useViewportFetch/useViewportFetch';
import useNearbyFetch from './useNearbyFetch/useNearbyFetch';
import useMergePlaces from './useMergePlaces/useMergePlaces';
const FETCH_LIMIT = 20;

const useFetchTopPlaces = ({ enabled }: {
  enabled?: boolean;
}): TopPlaceItem[] => {

  const { viewportTopPlaces } = useViewportFetch( FETCH_LIMIT, enabled );
  const { nearbyTopPlaces } = useNearbyFetch( { limit: FETCH_LIMIT, enabled } );
  const topPlaces = useMergePlaces({ viewportPlaces: viewportTopPlaces, nearbyPlaces: nearbyTopPlaces });

  return topPlaces;
};

export default useFetchTopPlaces;
