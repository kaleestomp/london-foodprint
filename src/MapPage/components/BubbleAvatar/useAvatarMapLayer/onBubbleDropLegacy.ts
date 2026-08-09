import { useEffect, useRef, useCallback } from 'react';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import L from 'leaflet';

import BubbleAvatarPin from '../BubbleAvatarPin/BubbleAvatarPin';
import getMarkerSizeFromCSS from './addAvatarMarker/getMarkerSizeFromCss';
import addPlaceMarkers from '../../Map/DataLayer/DynamicPlacesLayer/usePlacesLayer/placeMarkers/addPlaceMarkers';
import useRequestNearby from '../../../request/useRequestNearby/useRequestNearby';
import { type TilePlacePreview } from '../../../request/useRequestTiles/request';
import selectTopPlaces from '../../Map/DataLayer/TopPlacesLayer/InputHooks/useNearbyFetch/selectTopPlaces';
import getVisibleMapTargetScreenPoint from '../MapNavigation/getVisibleMapTargetScreenPoint';
import { ZOOM_LEVEL } from '../config';
import useMapViewportNavigation from '../MapNavigation/useMapViewportNavigation';
import addSearchRadiusMarker from './addSearchRadiusMarker/addSearchRadiusMarker';
import addPointerListeners from './addAvatarMarker/addAvatarPointerListeners';
import useNearbySearchParams from '../../Map/DataLayer/NearbyPlacesLayer/useNearbySearchParams';

import { useBubbleAvatarState } from '../BubbleAvatarStateContext';
import { usePullUpPanelMetrics } from '../../PullUpPanel/SnapHooks/PullUpPanelSnapContext';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import { useIsMobileCtx } from '../../../../context/IsMobileContext';

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
) => {

  const { handlePickup } = useBubbleAvatarState();
  const { searchMask } = useSearchFilters();
  /** Clears the map avatar; receives screen coords so MapCard can reposition BubbleButton */

  const { focusMap } = useMapViewportNavigation({ mapRef });
  const isMobile = useIsMobileCtx();
  const { panelHeight, translateY } = usePullUpPanelMetrics();
  
  const markerRef = useRef<L.Marker | null>(null);
  const reactRootRef = useRef<Root | null>(null);
  const placesLayerRef = useRef<L.LayerGroup | null>(null);
  // const entryDelayRef = useRef(0);
  const panelMetricsRef = useRef({ isMobile, panelHeight, translateY });
  // Keep onPickup fresh without invalidating the main effect

  const onPickupRef = useRef(handlePickup);
  useEffect(() => { onPickupRef.current = handlePickup; }, [handlePickup]);
  useEffect(() => { panelMetricsRef.current = { isMobile, panelHeight, translateY } }, [isMobile, panelHeight, translateY]);

  // Bubble drop owns nearby radius search.
  const nearbySearchParams = useNearbySearchParams();
  const { res: nearbyRes, isPlaceholderData } = useRequestNearby(nearbySearchParams);

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
    const center = searchMask?.center;
    if (!map || !nearbyRes || !center) return;
    if (isPlaceholderData) return;

    if (placesLayerRef.current) {
      map.removeLayer(placesLayerRef.current);
      placesLayerRef.current = null;
    }
    const layer = L.layerGroup().addTo(map);
    placesLayerRef.current = layer;
    const topNearbyIds = new Set(selectTopPlaces(nearbyRes.data, 10).map((place) => place.id));
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
      L.latLng(center.lat, center.lng),
      0, //entryDelayRef.current,
      25, // Stagger nearby pins to avoid overlap
    );
  }, [nearbyRes, isPlaceholderData, mapRef, searchMask]);

  // ── React to droppedPos changes ────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const center = searchMask?.center;
    if (!map || !center) return;

    const { lat, lng } = center;
    let cleanupCircle = () => { };
    const {
      isMobile: isMobileAtDrop,
      panelHeight: panelHeightAtDrop,
      translateY: translateYAtDrop,
    } = panelMetricsRef.current;

    // const entryDelayMs = map.getZoom() !== ZOOM_LEVEL ? DROP_ENTRY_DELAY_MS : 0;
    // entryDelayRef.current = entryDelayMs;

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
    cleanupCircle = addSearchRadiusMarker( map, lat, lng, searchMask?.radiusM ?? 0, 0 );

    // 3. Avatar marker — interactive: true lets Leaflet block map-pan on press
    const pinSize = getMarkerSizeFromCSS();
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

      removeLongPress = addPointerListeners( markerEl, map, onPickupRef.current);
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
  }, [searchMask, mapRef, clearAll, focusMap]);
};

export default onBubbleDrop;
