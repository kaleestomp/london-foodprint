import { useEffect, useRef, useCallback } from 'react';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import L from 'leaflet';

import BubbleAvatarPin from '../BubbleAvatarPin/BubbleAvatarPin';
import addPlaceMarkers from '../../Map/DataLayer/addPlacePins/addPlaceMarkers';
import useRequestNearby from '../../../request/useRequestNearby/useRequestNearby';
import { SCORE_TIER_THRESHOLD_MAP, useSearchFilters } from '../../../../context/SearchFiltersContext';
import { type LatLng, SEARCH_RADIUS, LONGPRESS_MS, ZOOM_LEVEL, CIRCLE_COLOR, DROP_ENTRY_DELAY_MS } from '../config';

const CIRCLE_ENTRY_MS = 280;
const PIN_SCALE = 0.625;
const PIN_SIZE = 90 * PIN_SCALE; // 56.25px

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
  const { effectiveCuisines, venueType, effectivePriceRanges, scoreTier, ratingSelectionMode } = useSearchFilters();
  const circleRef      = useRef<L.Circle | null>(null);
  const markerRef      = useRef<L.Marker | null>(null);
  const reactRootRef   = useRef<Root | null>(null);
  const placesLayerRef = useRef<L.LayerGroup | null>(null);
  const entryDelayRef  = useRef(0);
  // Keep onPickup fresh without invalidating the main effect
  const onPickupRef    = useRef(onPickup);
  useEffect(() => { onPickupRef.current = onPickup; }, [onPickup]);

  // Fetch nearby places via the shared request hook (caches results, handles abort)
  const { res: nearbyRes } = useRequestNearby(
    droppedPos ? {
      lat: droppedPos.lat,
      lng: droppedPos.lng,
      radius_m: SEARCH_RADIUS,
      cuisines: effectiveCuisines,
      venue_type: venueType ?? '',
      cost: effectivePriceRanges,
      score_basis: ratingSelectionMode === 'tier_independent' ? 1 : 0,
      rank_threshold: SCORE_TIER_THRESHOLD_MAP[scoreTier],
    } : null,
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
    if (!map || !nearbyRes || !droppedPos) return;
    if (placesLayerRef.current) {
      map.removeLayer(placesLayerRef.current);
      placesLayerRef.current = null;
    }
    const layer = L.layerGroup().addTo(map);
    placesLayerRef.current = layer;
    addPlaceMarkers(
      layer,
      nearbyRes.data,
      undefined,
      L.latLng(droppedPos.lat, droppedPos.lng),
      entryDelayRef.current,
    );
  }, [nearbyRes, mapRef, droppedPos]);

  // ── React to droppedPos changes ────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !droppedPos) return;

    const { lat, lng } = droppedPos;
    let pressTimer: ReturnType<typeof setTimeout> | null = null;
    let circleAnimFrame: number | null = null;
    let circleStartTimer: ReturnType<typeof setTimeout> | null = null;

    const entryDelayMs = map.getZoom() !== ZOOM_LEVEL ? DROP_ENTRY_DELAY_MS : 0;
    entryDelayRef.current = entryDelayMs;

    // 1. Zoom
    map.setView([lat, lng], ZOOM_LEVEL, { animate: true });

    // 2. Dashed 1 km circle — created invisible (radius 1, opacity 0) so no
    //    flash occurs before the entry delay fires.
    const circle = L.circle([lat, lng], {
      radius:    1,
      color:     CIRCLE_COLOR,
      weight:    4.0,
      fill:      false,
      dashArray: '10 10',
      opacity:   0,
    }).addTo(map);
    circleRef.current = circle;

    const startCircleIn = () => {
      const startTs = performance.now();
      const animateCircleIn = (ts: number) => {
        const t = Math.min((ts - startTs) / CIRCLE_ENTRY_MS, 1);
        const eased = 1 - (1 - t) ** 3;
        circle.setRadius(Math.max(1, SEARCH_RADIUS * eased));
        circle.setStyle({ opacity: 0.16 + 0.84 * eased });

        if (t < 1) {
          circleAnimFrame = window.requestAnimationFrame(animateCircleIn);
        }
      };

      circleAnimFrame = window.requestAnimationFrame(animateCircleIn);
    };
    if (entryDelayMs > 0) {
      circleStartTimer = setTimeout(startCircleIn, entryDelayMs);
    } else {
      startCircleIn();
    }

    // 3. Avatar marker — interactive: true lets Leaflet block map-pan on press
    const icon = L.divIcon({
      className: 'bubble-avatar-leaflet-icon',
      html:      '<div class="bubble-avatar-root"></div>',
      iconSize:   [PIN_SIZE, PIN_SIZE],
      iconAnchor: [PIN_SIZE / 2, PIN_SIZE / 2],
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
        }, LONGPRESS_MS);
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
      if (circleStartTimer) clearTimeout(circleStartTimer);
      if (circleAnimFrame !== null) window.cancelAnimationFrame(circleAnimFrame);
      // Defensive: if the marker was removed before pointerup/pointercancel,
      // Leaflet dragging can remain disabled.
      map.dragging.enable();
      clearAll(map);
    };
  }, [droppedPos, mapRef, clearAll]);
};

export default useBubbleDrop;
