import { useEffect, useRef } from 'react';
import type maplibregl from 'maplibre-gl';

import { usePlaceSelection } from '../../../context/PlaceSelectionContext';
import { usePullUpPanelSnapState } from '../PullUpPanel/SnapHooks/PullUpPanelSnapContext';
import useBottomPadding from './useBottomPadding/useBottomPadding';

type Props = {
  mapRef: React.RefObject<maplibregl.Map | null>;
};

type PanelSnapshot = {
  initialized: boolean;
  bottomPadding: number;
};

const PANEL_PADDING_ANIMATION_MS = 240;

const PullUpPanelMapViewportSync: React.FC<Props> = ({ mapRef }) => {
  const { isDragging } = usePullUpPanelSnapState();
  const { selectedPlaceId } = usePlaceSelection();

  const bottomPadding = useBottomPadding(mapRef);

  const prevRef = useRef<PanelSnapshot>({
    initialized: false,
    bottomPadding,
  });

  useEffect(() => {
    const prev = prevRef.current;
    const map = mapRef.current;

    const nextSnapshot: PanelSnapshot = {
      initialized: true,
      bottomPadding,
    };

    if (!prev.initialized) {
      prevRef.current = nextSnapshot;
      return;
    }

    const hasRelevantChange =
      prev.bottomPadding !== bottomPadding;

    if (!map || !hasRelevantChange || isDragging) {
      prevRef.current = nextSnapshot;
      return;
    }

    map.easeTo({
      center: map.getCenter(),
      padding: {
        top: 0,
        right: 0,
        bottom: bottomPadding,
        left: 0,
      },
      duration: PANEL_PADDING_ANIMATION_MS,
    });

    prevRef.current = nextSnapshot;
  }, [bottomPadding, isDragging, mapRef, selectedPlaceId]);

  return null;
};

export default PullUpPanelMapViewportSync;