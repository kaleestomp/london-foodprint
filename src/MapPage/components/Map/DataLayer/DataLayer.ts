import type * as maplibregl from 'maplibre-gl';

import useTopPlacesLayer from './TopPlacesLayer/useTopPlacesLayer';
import useHeatmapLayer from './HeatmapLayer/useHeatmapLayer';
import useClusterLayer from './ClusterLayer/useClusterLayer';
import DebugViewportLayer from './DebugViewportLayer/useDebugViewportLayer';
import { useAppUI } from '../../../../context/AppUIContext';


const DataLayer = (
  mapRef: React.RefObject<maplibregl.Map | null>,
  enabled = true,
): void => {
  const { topPlacesEnabled } = useAppUI();

  useTopPlacesLayer(mapRef, enabled && topPlacesEnabled);
  useClusterLayer(mapRef);
  useHeatmapLayer(mapRef);
  DebugViewportLayer(mapRef, false);
  
};

export default DataLayer;
