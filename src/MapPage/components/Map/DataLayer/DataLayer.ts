import { useState } from 'react';
import L from 'leaflet';

import useTopPlacesLayer from './TopPlacesLayer/useTopPlacesLayer';
import useDensityPlacesLayer from './DensityPlacesLayer/useDensityPlacesLayer';

const DataLayer = (
  mapRef: React.RefObject<L.Map | null>,
  enabled = true,
): void => {
  
  const [activeTopPlaceIds, setActiveTopPlaceIds] = useState<string[]>([]);

  useTopPlacesLayer({ mapRef, setActiveTopPlaceIds, enabled });

  useDensityPlacesLayer({ mapRef, activeTopPlaceIds, enabled });

};

export default DataLayer;
