import { useState } from 'react';
import L from 'leaflet';

// import { useBubbleAvatarState } from '../../BubbleAvatar/BubbleAvatarStateContext';
import useTopPlacesLayer from './TopPlacesLayer/useTopPlacesLayer';
import useDynamicPlacesLayer from './DynamicPlacesLayer/useDynamicPlacesLayer';
import useNearbyPlacesLayer from './NearbyPlacesLayer/useNearbyPlacesLayer';

const DataLayer = (
  mapRef: React.RefObject<L.Map | null>,
  enabled = true,
): void => {

  const [activeTopPlaceIdSet, setActiveTopPlaceIds] = useState<Set<string> | undefined>(undefined);
  // const { droppedPos } = useBubbleAvatarState();

  useTopPlacesLayer( mapRef, setActiveTopPlaceIds, enabled );
  useDynamicPlacesLayer( mapRef, activeTopPlaceIdSet, enabled );
  useNearbyPlacesLayer(mapRef, enabled);

};

export default DataLayer;
