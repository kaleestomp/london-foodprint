import L from 'leaflet';

import type { TopPlaceItem } from '../../../../../request/useRequestTopPlaces/request';
import  useViewportFetch from './useViewportFetch/useViewportFetch';
import useNearbyFetch from './useNearbyFetch/useNearbyFetch';
import useMergePlaces from './useMergePlaces/useMergePlaces';
const FETCH_LIMIT = 20;

type Props = {
  mapRef: React.RefObject<L.Map | null>;
  enabled: boolean;
};

const useFetchTopPlaces = ({ mapRef, enabled }: Props): TopPlaceItem[] => {

  const { viewportTopPlaces } = useViewportFetch({ mapRef, limit: FETCH_LIMIT, enabled });
  const { nearbyTopPlaces } = useNearbyFetch( { limit: FETCH_LIMIT, enabled } );
  const topPlaces = useMergePlaces({ viewportPlaces: viewportTopPlaces, nearbyPlaces: nearbyTopPlaces });

  return topPlaces;
};

export default useFetchTopPlaces;
