import { useEffect, useRef, useCallback } from 'react';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import L from 'leaflet';

import BubbleAvatarPin from '../BubbleAvatarPin/BubbleAvatarPin';
import addPlaceMarkers from '../../MapCard/Map/DataLayer/addPlacePins/addPlaceMarkers';
import useRequestNearby from '../../../request/useRequestNearby/useRequestNearby';
import { type LatLng, SEARCH_RADIUS, LONG_PRESS_MS, ZOOM_LEVEL, CIRCLE_COLOR } from '../config';

/**
 * Manages all Leaflet layers for the dropped bubble avatar.
 * Reactive: watches droppedPos state — React's effect cleanup handles
 * clearing layers whenever the position changes or becomes null.
 *
 * Long-press (150 ms) on the map avatar calls onPickup(x, y), which
 * triggers useMapPickup to start a raw-pointer carry.
 */
const useBubbleDrop = (
  mapRef:      React.RefObject<L.Map | null>,
  droppedPos:  LatLng | null,
  /** Clears the map avatar; receives screen coords so MapCard can reposition BubbleButton */
  onPickup:    (x: number, y: number) => void,
) => {
  const circleRef      = useRef<L.Circle | null>(null);
  const markerRef      = useRef<L.Marker | null>(null);
  const reactRootRef   = useRef<Root | null>(null);
  const placesLayerRef = useRef<L.LayerGroup | null>(null);
  // Keep onPickup fresh without invalidating the main effect
  const onPickupRef    = useRef(onPickup);
  useEffect(() => { onPickupRef.current = onPickup; }, [onPickup]);

  // Fetch nearby places via the shared request hook (caches results, handles abort)
  const { res: nearbyRes } = useRequestNearby(
    droppedPos ? { lat: droppedPos.lat, lng: droppedPos.lng, radius_m: SEARCH_RADIUS } : null,
  );

  // ── Clear all Leaflet layers ───────────────────────────────────────────
  // React root must unmount BEFORE marker removal (avoids detached-node warning).
  const clearAll = useCallback((map: L.Map) => {
    const root = reactRootRef.current;
    const marker = markerRef.current;
    const circle = circleRef.current;
    const placesLayer = placesLayerRef.current;

    reactRootRef.current = null;
    markerRef.current = null;
    circleRef.current = null;
    placesLayerRef.current = null;

    window.setTimeout(() => {
      if (root) root.unmount();
      if (marker) map.removeLayer(marker);
      if (circle) map.removeLayer(circle);
      if (placesLayer) map.removeLayer(placesLayer);
    }, 0);
  }, []);

  // ── Add/replace places layer when nearby results arrive ───────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !nearbyRes) return;
    if (placesLayerRef.current) {
      map.removeLayer(placesLayerRef.current);
      placesLayerRef.current = null;
    }
    const layer = L.layerGroup().addTo(map);
    placesLayerRef.current = layer;
    addPlaceMarkers(layer, nearbyRes.data);
  }, [nearbyRes, mapRef]);

  // ── React to droppedPos changes ────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !droppedPos) return;

    const { lat, lng } = droppedPos;
    let pressTimer: ReturnType<typeof setTimeout> | null = null;

    // 1. Zoom
    map.setView([lat, lng], ZOOM_LEVEL, { animate: true });

    // 2. Dashed 1 km circle (canvas renderer supports dashArray natively)
    const circle = L.circle([lat, lng], {
      radius:    SEARCH_RADIUS,
      color:     CIRCLE_COLOR,
      weight:    2.0,
      fill:      false,
      dashArray: '1 4',
    }).addTo(map);
    circleRef.current = circle;

    // 3. Avatar marker — interactive: true lets Leaflet block map-pan on press
    const icon = L.divIcon({
      className: 'bubble-avatar-leaflet-icon',
      html:      '<div class="bubble-avatar-root"></div>',
      iconSize:   [40, 40],
      iconAnchor: [20, 20],
    });
    const marker = L.marker([lat, lng], {
      icon,
      interactive: true,
      zIndexOffset: 10000,
    }).addTo(map);
    markerRef.current = marker;

    const markerEl = marker.getElement();
    if (markerEl) {
      // Mount animated React avatar
      const rootEl = markerEl.querySelector<HTMLElement>('.bubble-avatar-root');
      if (rootEl) {
        const root = createRoot(rootEl);
        reactRootRef.current = root;
        root.render(createElement(BubbleAvatarPin));
      }

      // Long-press: hold → pick up avatar
      // Three Leaflet-specific measures for responsiveness:
      //   1. preventDefault()         — stops browser context-menu / scroll gesture consuming the event
      //   2. setPointerCapture()      — we receive pointermove/up even if pointer leaves the element
      //   3. dragging.disable() NOW   — Leaflet's pan-detection starts on the very first pointerdown;
      //      deferring to the timer means a 250 ms window where Leaflet wins the gesture
      let startX = 0, startY = 0;

      const cancelPress = () => {
        if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
      };

      markerEl.addEventListener('pointerdown', (e: PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        markerEl.setPointerCapture(e.pointerId); // capture before Leaflet can intercept
        // NOTE: map.dragging.disable() is called here to win the gesture race against
        // Leaflet's pan-detection. This means if the long-press is cancelled (short tap),
        // we re-enable via releasePress. If Leaflet ever acquires pan in other contexts
        // this may need revisiting — tracked as a known trade-off.
        map.dragging.disable();
        startX = e.clientX; startY = e.clientY;
        pressTimer = setTimeout(() => {
          pressTimer = null;
          // Marker cleanup may happen before pointerup fires, so make sure
          // map panning is re-enabled before we hand control back to React.
          map.dragging.enable();
          onPickupRef.current(e.clientX, e.clientY);
        }, LONG_PRESS_MS);
      });

      markerEl.addEventListener('pointermove', (e: PointerEvent) => {
        if (Math.abs(e.clientX - startX) > 10 || Math.abs(e.clientY - startY) > 10) {
          cancelPress();
        }
      });

      const releasePress = () => {
        cancelPress();
        map.dragging.enable(); // re-enable if long-press didn't fire
      };

      markerEl.addEventListener('pointerup',     releasePress);
      markerEl.addEventListener('pointercancel', releasePress);
    }

    // Cleanup: runs when droppedPos changes or component unmounts
    // Places layer is managed by the nearbyRes effect above.
    return () => {
      if (pressTimer) clearTimeout(pressTimer);
      // Defensive: if the marker was removed before pointerup/pointercancel,
      // Leaflet dragging can remain disabled.
      map.dragging.enable();
      clearAll(map);
    };
  }, [droppedPos, mapRef, clearAll]);
};

export default useBubbleDrop;
