import type maplibregl from 'maplibre-gl';

import { useAppUI } from '../../../../../context/AppUIContext';
import useFetchCoordinates from './InputHooks/useFetchCoordinates';

const useHeatmapLayer = (
  mapRef?: React.RefObject<maplibregl.Map | null>,
  enabled?: boolean,
): void => {
  const { heatmapEnabled } = useAppUI();
  const { status, res } = useFetchCoordinates(enabled);

  console.log(res);
};

export default useHeatmapLayer;