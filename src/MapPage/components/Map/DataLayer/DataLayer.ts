import { useState } from 'react';
import L from 'leaflet';

import useTopPlacesLayer from './TopPlacesLayer/useTopPlacesLayer';
import useDynamicPlacesLayer from './DynamicPlacesLayer/useDynamicPlacesLayer';

const DataLayer = (
  mapRef: React.RefObject<L.Map | null>,
  enabled = true,
): void => {
  
  const [activeTopPlaceIds, setActiveTopPlaceIds] = useState<string[]>([]);

  useTopPlacesLayer({ mapRef, setActiveTopPlaceIds, enabled });
  useDynamicPlacesLayer({ mapRef, activeTopPlaceIds, enabled });

};

export default DataLayer;
