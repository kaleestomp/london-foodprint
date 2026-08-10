import { useState } from 'react';
import L from 'leaflet';

// import { useBubbleAvatarState } from '../../BubbleAvatar/BubbleAvatarStateContext';
import useTopPlacesLayer from './TopPlacesLayer/useTopPlacesLayer';
import useHeatmapLayer from './HeatmapLayer/useHeatmapLayer';
import useDynamicPlacesLayer from './DynamicPlacesLayer/useDynamicPlacesLayer';
import useNearbyPlacesLayer from './NearbyPlacesLayer/useNearbyPlacesLayer';

const DataLayer = (
  mapRef: React.RefObject<L.Map | null>,
  enabled = true,
): void => {

  const [activeTopPlaceIdSet, setActiveTopPlaceIds] = useState<Set<string> | undefined>(undefined);

  useTopPlacesLayer( mapRef, setActiveTopPlaceIds, enabled );
  useHeatmapLayer( mapRef, enabled );
  useDynamicPlacesLayer( mapRef, activeTopPlaceIdSet, enabled );
  useNearbyPlacesLayer(mapRef, activeTopPlaceIdSet, enabled);

};

export default DataLayer;
