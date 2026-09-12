import type * as maplibregl from 'maplibre-gl';

import useTopPlacesLayer from './TopPlacesLayer/useTopPlacesLayer';
import useHeatmapLayer from './HeatmapLayer/useHeatmapLayer';
import useClusterLayer from './ClusterLayer/useClusterLayer';
import DebugViewportLayer from './DebugViewportLayer/useDebugViewportLayer';
import useBoundaryLayer from './BoundaryLayer/useBoundaryLayer';
import useStreetLayer from './StreetLayer/useStreetLayer';


const DataLayer = (
  mapRef: React.RefObject<maplibregl.Map | null>,
  enabled = true,
): void => {
  
  useTopPlacesLayer( mapRef, enabled );
  useClusterLayer(mapRef);
  useHeatmapLayer(mapRef);
  useBoundaryLayer(mapRef);
  useStreetLayer(mapRef);
  DebugViewportLayer(mapRef, false);
  
};

export default DataLayer;
