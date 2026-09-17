import { type FC } from 'react'; 
import type * as maplibregl from 'maplibre-gl';

import useMapLocationNavigation from './useMapLocationNavigation';
import { useDrawerState } from '../../../components/SlideUpDrawer/DrawerStateContext';

// INSERTED BELOW DRAWER STATE PROVIDER TO BE DRAWER AWARE
const MapNavigationController: FC<{
  mapRef: React.RefObject<maplibregl.Map | null>;
}> = ({ mapRef }) => {
  const { snapPX } = useDrawerState();
  useMapLocationNavigation(mapRef, snapPX);
  return null;
};

export default MapNavigationController;