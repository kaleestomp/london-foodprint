import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import L from 'leaflet';

import BubbleAvatarPin from '../../BubbleAvatarPin/BubbleAvatarPin';
import getMarkerSizeFromCss from './getMarkerSizeFromCss';
import addPointerListeners from './addAvatarPointerListeners';

/**
 * Manages all Leaflet layers for the dropped bubble avatar.
 * Reactive: watches droppedPos state — React's effect cleanup handles
 * clearing layers whenever the position changes or becomes null.
 *
 * Long-press (150 ms) on the map avatar calls onPickup(x, y), which
 * triggers useMapPickup to start a raw-pointer carry.
 */
const addAvatarMarker = (
    map: L.Map,
    lat: number,
    lng: number,
    reactRootRef: React.RefObject<Root | null>,
    onPickupRef: React.RefObject<(x: number, y: number) => void>
) => {

    // AVATAR MARKER 
    // interactive: true lets Leaflet block map-pan on press
    const markerSize = getMarkerSizeFromCss();
    const icon = L.divIcon({
        className: 'bubble-avatar-leaflet-icon',
        html: '<div class="bubble-avatar-root"></div>',
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize / 2],
    });
    const marker = L.marker([lat, lng], { icon, interactive: true, zIndexOffset: 10000 }).addTo(map);
    const markerEl = marker.getElement();
    let removeListeners = () => {};
    if (markerEl) {
        // Mount animated React avatar
        const rootEl = markerEl.querySelector<HTMLElement>('.bubble-avatar-root');
        if (rootEl) {
            const root = createRoot(rootEl);
            reactRootRef.current = root;
            root.render(createElement(BubbleAvatarPin));
        }
        removeListeners = addPointerListeners(markerEl, map, onPickupRef.current)
    }
    
    const cleanup = () => {
        removeListeners();
        const root = reactRootRef.current;
        reactRootRef.current = null;
        // React root must unmount BEFORE marker removal 
        // (avoids detached-node warning).
        window.setTimeout(() => {
            if (root) root.unmount();
            if (marker) map.removeLayer(marker);
        }, 0);
    }

    return cleanup;
};

export default addAvatarMarker;
