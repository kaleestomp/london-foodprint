import { useEffect, useRef } from 'react';
import type maplibregl from 'maplibre-gl';

import { usePullUpPanelSnapState } from '../PullUpPanel/SnapHooks/PullUpPanelSnapContext';
import useMapViewportNavigation from '../BubbleAvatar/MapNavigation/useMapViewportNavigation';
import getVisibleMapTargetScreenPoint from '../BubbleAvatar/MapNavigation/getVisibleMapTargetScreenPoint';

type Props = {
  mapRef: React.RefObject<maplibregl.Map | null>;
};

type PanelSnapshot = {
  initialized: boolean;
  isMobile: boolean;
  snapState: 'closed' | 'open';
  panelHeight: number;
  translateY: number;
};

const PullUpPanelMapViewportSync: React.FC<Props> = ({ mapRef }) => {
  const { isMobile, snapState, panelHeight, translateY } = usePullUpPanelSnapState();
  const { focusMap } = useMapViewportNavigation({ mapRef });
  const openOffsetRef = useRef<{ dx: number; dy: number } | null>(null);
  const prevRef = useRef<PanelSnapshot>({
    initialized: false,
    isMobile,
    snapState,
    panelHeight,
    translateY,
  });

  useEffect(() => {
    const prev = prevRef.current;
    const map = mapRef.current;
    if (!prev.initialized) {
      prevRef.current = {
        initialized: true,
        isMobile,
        snapState,
        panelHeight,
        translateY,
      };
      return;
    }

    const hasStateTransition =
      prev.isMobile &&
      isMobile &&
      prev.snapState !== snapState &&
      ((prev.snapState === 'closed' && snapState === 'open') ||
        (prev.snapState === 'open' && snapState === 'closed'));

    if (!map || !hasStateTransition) {
      prevRef.current = {
        initialized: true,
        isMobile,
        snapState,
        panelHeight,
        translateY,
      };
      return;
    }

    const mapRect = map.getContainer().getBoundingClientRect();
    const screenCenter = {
      x: mapRect.left + mapRect.width / 2,
      y: mapRect.top + mapRect.height / 2,
    };
    const prevVisibleCenter = getVisibleMapTargetScreenPoint(
      map,
      prev.isMobile,
      prev.panelHeight,
      prev.translateY,
    ) ?? screenCenter;
    const nextVisibleCenter = getVisibleMapTargetScreenPoint(
      map,
      isMobile,
      panelHeight,
      translateY,
    ) ?? screenCenter;

    const isOpening = prev.snapState === 'closed' && snapState === 'open';
    const isClosing = prev.snapState === 'open' && snapState === 'closed';

    if (isOpening) {
      // Capture the exact open shift so close can reverse this distance symmetrically.
      openOffsetRef.current = {
        dx: screenCenter.x - nextVisibleCenter.x,
        dy: screenCenter.y - nextVisibleCenter.y,
      };
    }

    const reverseOpenSource = openOffsetRef.current
      ? {
          x: screenCenter.x - openOffsetRef.current.dx,
          y: screenCenter.y - openOffsetRef.current.dy,
        }
      : prevVisibleCenter;

    const sourceScreenPoint = isClosing
      ? reverseOpenSource
      : (isOpening ? screenCenter : prevVisibleCenter);
    const targetScreenPoint = isOpening
      ? nextVisibleCenter
      : screenCenter;

    if (isClosing) {
      openOffsetRef.current = null;
    }
    const sourceContainerPoint: [number, number] = [
      sourceScreenPoint.x - mapRect.left,
      sourceScreenPoint.y - mapRect.top,
    ];
    const sourceLngLat = map.unproject(sourceContainerPoint);

    focusMap({
      target: { lat: sourceLngLat.lat, lng: sourceLngLat.lng },
      method: 'pan',
      animate: true,
      targetScreenPoint,
      skipIfWithinMeters: 0.5,
    });

    prevRef.current = {
      initialized: true,
      isMobile,
      snapState,
      panelHeight,
      translateY,
    };
  }, [focusMap, isMobile, panelHeight, snapState, translateY]);

  return null;
};

export default PullUpPanelMapViewportSync;