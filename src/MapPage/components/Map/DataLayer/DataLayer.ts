import { useState } from 'react';
import type maplibregl from 'maplibre-gl';

import useTopPlacesLayer from './TopPlacesLayer/useTopPlacesLayer';
// import useDynamicPlacesLayer from './DynamicPlacesLayer/useDynamicPlacesLayer';
import useNearbyPlacesLayer from './NearbyPlacesLayer/useNearbyPlacesLayer';
import useHeatmapLayer from './HeatmapLayer/useHeatmapLayer';
import useClusterLayer from './ClusterLayer/useClusterLayer';


const DataLayer = (
  mapRef: React.RefObject<maplibregl.Map | null>,
  enabled = true,
): void => {

  const [activeTopPlaceIdSet, setActiveTopPlaceIds] = useState<Set<string> | undefined>(undefined);

  useTopPlacesLayer( mapRef, setActiveTopPlaceIds, enabled );
  // useDynamicPlacesLayer( mapRef, activeTopPlaceIdSet, enabled );
  useNearbyPlacesLayer(mapRef, activeTopPlaceIdSet, enabled);

  
  useHeatmapLayer(mapRef);
  useClusterLayer(mapRef);

};

export default DataLayer;
