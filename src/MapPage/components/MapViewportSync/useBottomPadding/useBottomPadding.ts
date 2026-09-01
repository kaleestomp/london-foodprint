import { useMemo, useRef } from 'react';
import type maplibregl from 'maplibre-gl';
import { useIsMobileCtx } from '../../../../context/IsMobileContext';

import { useDrawerState } from '../../SlideUpDrawer/DrawerStateContext';
import { usePlaceSelection } from '../../../../context/PlaceSelectionContext';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';
// import { usePullUpPanelSnapState } from '../../PullUpPanel/SnapHooks/PullUpPanelSnapContext';
import getRecenterOffset from './isMarkerWouldbeBlocked';

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
  const isPanelUpRef = useRef<boolean>(isPanelUp);
  const paddingRef = useRef<number>(0);

  const bottomPadding = useMemo(() => {
    if (!isMobile || !snapPX) 
      return 0;
    
    // Default to previous if Avatar is exiting
    // to avoid trigger viewport shift
    const avatarOnMap = Boolean(searchMask);
    const isAvatarExiting = !avatarOnMap && avatarOnMapRef.current;
    const avatarNotChanged = avatarOnMap === avatarOnMapRef.current;
    avatarOnMapRef.current = avatarOnMap;
    if (isPanelUp && isAvatarExiting) 
      return paddingRef.current;
    
    // Default to previous if Avatar or Panel have not changed
    // Avoid map shift when padding is reset to 0 from non-zero
    // EG. selected a Place that triggers Padding; 
    // followed by selection of another place that should not trigger padding;
    const panelNotChanged = isPanelUp === isPanelUpRef.current;
    isPanelUpRef.current = isPanelUp;
    avatarOnMapRef.current = avatarOnMap;
    if (avatarNotChanged && panelNotChanged) 
      return paddingRef.current;

    const isBubbleAvatarWouldbeBlocked = avatarOnMap;
    if (isPanelUp && isBubbleAvatarWouldbeBlocked) {
        const padding = Math.max(0, Math.round(snapPX));
        paddingRef.current = padding;
        return padding;
      }

    const recenterY = getRecenterOffset( mapRef.current, selectedPlaceId, snapPX );
    if (isPanelUp && Boolean(selectedPlaceId) && recenterY > 0) {
      paddingRef.current = recenterY*2;
      return recenterY*2;
    }

    paddingRef.current = 0;
    return 0;

  }, [isPanelUp, searchMask, selectedPlaceId, snapPX]);

  
  return bottomPadding;
};

export default useBottomPadding;