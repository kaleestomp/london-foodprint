import type { TopPlaceItem } from '../../../../../request/useRequestTopPlaces/request';
import  useViewportFetch from './useViewportFetch/useViewportFetch';
import useNearbyFetch from './useNearbyFetch/useNearbyFetch';
import useMergePlaces from './useMergePlaces/useMergePlaces';
import getFetchLimit from './getFetchLimit';

const useFetchTopPlaces = ({ enabled }: {
  enabled?: boolean;
}): TopPlaceItem[] => {

  const viewportTopPlaces = useViewportFetch( getFetchLimit(), enabled );
  const nearbyTopPlaces = useNearbyFetch( 20, enabled );
  const topPlaces = useMergePlaces(viewportTopPlaces, nearbyTopPlaces);

  return topPlaces;
};

export default useFetchTopPlaces;
