import { useRef } from 'react';
import type maplibregl from 'maplibre-gl';
import { useIsMobileCtx } from '../../../../context/IsMobileContext';

import { useDrawerState } from '../../SlideUpDrawer/DrawerStateContext';
import { usePlaceSelection } from '../../../../context/PlaceSelectionContext';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';
// import { usePullUpPanelSnapState } from '../../PullUpPanel/SnapHooks/PullUpPanelSnapContext';
import getRecenterOffset from './getRecenterOffset';
import getAvatarRecenterOffset from '../getAvatarRecenterOffset';

const useBottomPadding = (
  mapRef: React.RefObject<maplibregl.Map | null>
): number => {

  const isMobile = useIsMobileCtx();
  const { snapPX, isClosed } = useDrawerState();
  // const { panelHeight } = usePullUpPanelSnapState();
  const { searchMask } = useSearchFilters();
  const { selectedPlaceId } = usePlaceSelection();

  // ONLY UPDATE WHEN PANEL OPENS / CLOSES
  const isPanelUp = !isClosed;
  // const panelTopPositionPX = panelHeight - translateY;
  const avatarOnMapRef = useRef<boolean>(Boolean(searchMask));
  const paddingRef = useRef<number>(0);

  const calculateBottomPadding = (): number => {
    if (!isMobile || !snapPX)
      return 0;

    // Preserve the current padding while the avatar marker is being removed.
    const avatarOnMap = Boolean(searchMask);
    const isAvatarExiting = !avatarOnMap && avatarOnMapRef.current;
    avatarOnMapRef.current = avatarOnMap;
    if (isPanelUp && isAvatarExiting)
      return paddingRef.current;

    const avatarOffset = getAvatarRecenterOffset(mapRef.current, snapPX);
    const avatarWouldBeBlocked = isPanelUp && avatarOnMap && avatarOffset;
    const paddingAvatar = avatarWouldBeBlocked ? Math.max(0, Math.round(avatarOffset)) : 0;
    
    const markerOffset = getRecenterOffset(mapRef.current, selectedPlaceId, snapPX);
    const markerWouldBeBlocked = isPanelUp && Boolean(selectedPlaceId) && markerOffset > 0;
    const paddingMarker = markerWouldBeBlocked ? Math.max(0, Math.round(markerOffset)) : 0;

    const padding = (avatarWouldBeBlocked || markerWouldBeBlocked) 
      ? Math.max(paddingAvatar, paddingMarker) : 0;
    paddingRef.current = padding;

    return padding;
  };

  const bottomPadding = calculateBottomPadding();

  
  return bottomPadding * 1.4;
};

export default useBottomPadding;