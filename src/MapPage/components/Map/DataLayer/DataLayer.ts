import type maplibregl from 'maplibre-gl';

import useTopPlacesLayer from './TopPlacesLayer/useTopPlacesLayer';
import useHeatmapLayer from './HeatmapLayer/useHeatmapLayer';
import useClusterLayer from './ClusterLayer/useClusterLayer';
import DebugViewportLayer from './DebugViewportLayer/useDebugViewportLayer';


const DataLayer = (
  mapRef: React.RefObject<maplibregl.Map | null>,
  enabled = true,
): void => {

  // const [_, setActiveTopPlaceIds] = useState<Set<string> | undefined>(undefined);
  
  useTopPlacesLayer( mapRef, enabled );
  useClusterLayer(mapRef);
  useHeatmapLayer(mapRef);
  DebugViewportLayer(mapRef, false);
  
};

export default DataLayer;
