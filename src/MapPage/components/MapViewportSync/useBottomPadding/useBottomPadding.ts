import { useMemo, useRef } from 'react';
import type maplibregl from 'maplibre-gl';

import { usePlaceSelection } from '../../../../context/PlaceSelectionContext';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import { usePullUpPanelMetrics, usePullUpPanelSnapState } from '../../PullUpPanel/SnapHooks/PullUpPanelSnapContext';
import getRecenterOffset from './isMarkerWouldbeBlocked';

const useBottomPadding = (
  mapRef: React.RefObject<maplibregl.Map | null>
): number => {

  const { isMobile, snapState } = usePullUpPanelSnapState();
  const { panelHeight, translateY } = usePullUpPanelMetrics();
  const { searchMask } = useSearchFilters();
  const { selectedPlaceId } = usePlaceSelection();

  // ONLY UPDATE WHEN PANEL OPENS / CLOSES
  const isPanelOpen = isMobile && snapState === 'open';
  const panelTopPositionPX = panelHeight - translateY;
  const avatarOnMapRef = useRef<boolean>(Boolean(searchMask));
  const isPanelOpenRef = useRef<boolean>(isPanelOpen);
  const paddingRef = useRef<number>(0);

  const bottomPadding = useMemo(() => {

    
    // Default to previous if Avatar is exiting
    // to avoid trigger viewport shift
    const avatarOnMap = Boolean(searchMask);
    const isAvatarExiting = !avatarOnMap && avatarOnMapRef.current;
    const avatarNotChanged = avatarOnMap === avatarOnMapRef.current;
    avatarOnMapRef.current = avatarOnMap;
    if (isPanelOpen && isAvatarExiting) 
      return paddingRef.current;
    
    // Default to previous if Avatar or Panel have not changed
    // Avoid map shift when padding is reset to 0 from non-zero
    // EG. selected a Place that triggers Padding; 
    // followed by selection of another place that should not trigger padding;
    const panelNotChanged = isPanelOpen === isPanelOpenRef.current;
    isPanelOpenRef.current = isPanelOpen;
    avatarOnMapRef.current = avatarOnMap;
    if (avatarNotChanged && panelNotChanged) 
      return paddingRef.current;

    const isBubbleAvatarWouldbeBlocked = avatarOnMap;
    if (isPanelOpen && isBubbleAvatarWouldbeBlocked) {
        const padding = Math.max(0, Math.round(panelTopPositionPX));
        paddingRef.current = padding;
        return padding;
      }

    const recenterY = getRecenterOffset( mapRef.current, selectedPlaceId, panelHeight );
    if (isPanelOpen && Boolean(selectedPlaceId) && recenterY > 0) {
      paddingRef.current = recenterY*2;
      return recenterY*2;
    }

    paddingRef.current = 0;
    return 0;

  }, [isPanelOpen, searchMask, selectedPlaceId, panelHeight, panelTopPositionPX]);

  
  return bottomPadding;
};

export default useBottomPadding;