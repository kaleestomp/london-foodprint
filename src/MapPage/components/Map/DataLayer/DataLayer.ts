import { useState } from 'react';
import type maplibregl from 'maplibre-gl';

import useTopPlacesLayer from './TopPlacesLayer/useTopPlacesLayer';
import useDynamicPlacesLayer from './DynamicPlacesLayer/useDynamicPlacesLayer';
import useNearbyPlacesLayer from './NearbyPlacesLayer/useNearbyPlacesLayer';


const DataLayer = (
  mapRef: React.RefObject<maplibregl.Map | null>,
  enabled = true,
): void => {

  const [activeTopPlaceIdSet, setActiveTopPlaceIds] = useState<Set<string> | undefined>(undefined);

  useTopPlacesLayer( mapRef, setActiveTopPlaceIds, enabled );
  useDynamicPlacesLayer( mapRef, activeTopPlaceIdSet, enabled );
  useNearbyPlacesLayer(mapRef, activeTopPlaceIdSet, enabled);

};

export default DataLayer;
