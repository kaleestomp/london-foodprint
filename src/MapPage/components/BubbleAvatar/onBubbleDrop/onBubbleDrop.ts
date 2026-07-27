import { useEffect, useRef, useCallback } from 'react';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import L from 'leaflet';

import BubbleAvatarPin from '../BubbleAvatarPin/BubbleAvatarPin';
import getPinSizeFromCss from './getPinSizeFromCss';
import addPlaceMarkers from '../../Map/DataLayer/DensityPlacesLayer/addPlacePins/addPlaceMarkers';
import useRequestNearby from '../../../request/useRequestNearby/useRequestNearby';
import { type TilePlacePreview } from '../../../request/useRequestTiles/request';
import selectTopRankedPlaces from '../../../utils/selectTopRankedPlaces';
import useIsMobile from '../../../../utils/browser/useIsMobile';
import getVisibleMapTargetScreenPoint from '../getVisibleMapTargetScreenPoint';
import { type LatLng, ZOOM_LEVEL, DROP_ENTRY_DELAY_MS } from '../config';
import useMapViewportNavigation from '../onBubbleDrag/useMapViewportNavigation';
import setupBubbleDropCircle from './setupBubbleDropCircle';
import setupBubbleDropLongPress from './setupBubbleDropLongPress';
import getNearbySearchParams from './getNearbySearchParams';

import { useBubbleAvatarState } from '../BubbleAvatarStateContext';
import { usePullUpPanelMetrics } from '../../PullUpPanel/SnapHooks/PullUpPanelSnapContext';

/**
 * Manages all Leaflet layers for the dropped bubble avatar.
 * Reactive: watches droppedPos state — React's effect cleanup handles
 * clearing layers whenever the position changes or becomes null.
 *
 * Long-press (150 ms) on the map avatar calls onPickup(x, y), which
 * triggers useMapPickup to start a raw-pointer carry.
 */
const onBubbleDrop = (
  mapRef: React.RefObject<L.Map | null>,
  droppedPos: LatLng | null,
) => {

  const { handlePickup: onPickup } = useBubbleAvatarState();
  /** Clears the map avatar; receives screen coords so MapCard can reposition BubbleButton */

  const { focusMap } = useMapViewportNavigation({ mapRef });
  const isMobile = useIsMobile();
  const { panelHeight, translateY } = usePullUpPanelMetrics();
  const markerRef = useRef<L.Marker | null>(null);
  const reactRootRef = useRef<Root | null>(null);
  const placesLayerRef = useRef<L.LayerGroup | null>(null);
  const entryDelayRef = useRef(0);
  const panelMetricsRef = useRef({ isMobile, panelHeight, translateY });
  // Keep onPickup fresh without invalidating the main effect
  
  const onPickupRef = useRef(onPickup);
  useEffect(() => { onPickupRef.current = onPickup; }, [onPickup]);
  useEffect(() => {
    panelMetricsRef.current = { isMobile, panelHeight, translateY };
  }, [isMobile, panelHeight, translateY]);

  // Bubble drop owns nearby radius search.
  const nearbySearchParams = getNearbySearchParams(droppedPos);
  const { res: nearbyRes, queryKey: nearbyQueryKey, responseKey: nearbyResponseKey } = useRequestNearby(nearbySearchParams);
  
  // ── Clear all Leaflet layers ───────────────────────────────────────────
  // React root must unmount BEFORE marker removal (avoids detached-node warning).
  const clearAll = useCallback((map: L.Map) => {
    const root = reactRootRef.current;
    const marker = markerRef.current;
    const placesLayer = placesLayerRef.current;

    reactRootRef.current = null;
    markerRef.current = null;
    placesLayerRef.current = null;

    window.setTimeout(() => {
      if (root) root.unmount();
      if (marker) map.removeLayer(marker);
      if (placesLayer) map.removeLayer(placesLayer);
    }, 0);
  }, []);

  // ── Add/replace places layer when nearby results arrive ───────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !nearbyRes || !droppedPos) return;
    if (nearbyResponseKey !== nearbyQueryKey) return;

    if (placesLayerRef.current) {
      map.removeLayer(placesLayerRef.current);
      placesLayerRef.current = null;
    }
    const layer = L.layerGroup().addTo(map);
    placesLayerRef.current = layer;
    const topNearbyIds = new Set(selectTopRankedPlaces(nearbyRes.data, 10).map((place) => place.id));
    const previewPlaces: TilePlacePreview[] = nearbyRes.data
      .filter((place) => !topNearbyIds.has(place.id))
      .map((place) => ({
        id: place.id,
        lat: place.lat,
        lon: place.lon,
        tier: place.rank,
      }));
    addPlaceMarkers(
      layer,
      previewPlaces,
      undefined,
      undefined,
      L.latLng(droppedPos.lat, droppedPos.lng),
      entryDelayRef.current,
      25, // Stagger nearby pins to avoid overlap
    );
  }, [nearbyRes, nearbyQueryKey, nearbyResponseKey, mapRef, droppedPos]);

  // ── React to droppedPos changes ────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !droppedPos) return;

    const { lat, lng } = droppedPos;
    let cleanupCircle = () => { };
    const {
      isMobile: isMobileAtDrop,
      panelHeight: panelHeightAtDrop,
      translateY: translateYAtDrop,
    } = panelMetricsRef.current;

    const entryDelayMs = map.getZoom() !== ZOOM_LEVEL ? DROP_ENTRY_DELAY_MS : 0;
    entryDelayRef.current = entryDelayMs;

    const targetScreenPoint = getVisibleMapTargetScreenPoint(
      map,
      isMobileAtDrop,
      panelHeightAtDrop,
      translateYAtDrop,
    );

    // 1. Zoom
    // map.setView([lat, lng], ZOOM_LEVEL, { animate: true });
    focusMap({
      target: { lat, lng },
      method: 'setView',
      zoom: ZOOM_LEVEL,
      animate: true,
      targetScreenPoint,
    });

    // 2. Dashed 1 km circle — delegated to a helper that owns creation,
    //    entry animation, and cleanup.
    cleanupCircle = setupBubbleDropCircle({
      map,
      lat,
      lng,
      entryDelayMs,
    });

    // 3. Avatar marker — interactive: true lets Leaflet block map-pan on press
    const pinSize = getPinSizeFromCss();
    const icon = L.divIcon({
      className: 'bubble-avatar-leaflet-icon',
      html: '<div class="bubble-avatar-root"></div>',
      iconSize: [pinSize, pinSize],
      iconAnchor: [pinSize / 2, pinSize / 2],
    });
    const marker = L.marker([lat, lng], {
      icon,
      interactive: true,
      zIndexOffset: 10000,
    }).addTo(map);
    markerRef.current = marker;
    let removeLongPress = () => { };

    const markerEl = marker.getElement();
    if (markerEl) {
      // Mount animated React avatar
      const rootEl = markerEl.querySelector<HTMLElement>('.bubble-avatar-root');
      if (rootEl) {
        const root = createRoot(rootEl);
        reactRootRef.current = root;
        root.render(createElement(BubbleAvatarPin));
      }

      removeLongPress = setupBubbleDropLongPress({
        markerEl,
        map,
        onPickup: onPickupRef.current,
      });
    }

    // Cleanup: runs when droppedPos changes or component unmounts
    // Places layer is managed by the nearbyRes effect above.
    return () => {
      cleanupCircle();
      removeLongPress();
      // Defensive: if the marker was removed before pointerup/pointercancel,
      // Leaflet dragging can remain disabled.
      map.dragging.enable();
      clearAll(map);
    };
  }, [droppedPos, mapRef, clearAll, focusMap]);
};

export default onBubbleDrop;
