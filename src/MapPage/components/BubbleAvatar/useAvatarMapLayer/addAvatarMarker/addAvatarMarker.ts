import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import maplibregl from 'maplibre-gl';

import BubbleAvatarPin from '../../BubbleAvatarPin/BubbleAvatarPin';
import getMarkerSizeFromCss from './getMarkerSizeFromCss';
import addPointerListeners from './addAvatarPointerListeners';

/**
 * Manages the dropped bubble avatar marker.
 * Reactive: watches droppedPos state — React's effect cleanup handles
 * clearing layers whenever the position changes or becomes null.
 *
 * Long-press (150 ms) on the map avatar calls onPickup(x, y), which
 * triggers useMapPickup to start a raw-pointer carry.
 */
const addAvatarMarker = (
    map: maplibregl.Map,
    lat: number,
    lng: number,
    reactRootRef: React.RefObject<Root | null>,
    onPickupRef: React.RefObject<(x: number, y: number) => void>
) => {

    // AVATAR MARKER
    const markerSize = getMarkerSizeFromCss();
    const markerEl = document.createElement('div');
    markerEl.className = 'bubble-avatar-maplibre-marker';
    markerEl.style.width = `${markerSize}px`;
    markerEl.style.height = `${markerSize}px`;
    markerEl.style.zIndex = '99';

    const rootEl = document.createElement('div');
    rootEl.className = 'bubble-avatar-root';
    markerEl.appendChild(rootEl);

    const marker = new maplibregl.Marker({
        element: markerEl,
        anchor: 'center',
        offset: [0, 0],
    })
        .setLngLat([lng, lat])
        .addTo(map);

    let removeListeners = () => {};
    const markerElement = marker.getElement();
    if (markerElement) {
        // Mount animated React avatar
        const markerRoot = markerElement.querySelector<HTMLElement>('.bubble-avatar-root');
        if (markerRoot) {
            const root = createRoot(markerRoot);
            reactRootRef.current = root;
            root.render(createElement(BubbleAvatarPin));
        }
        removeListeners = addPointerListeners(markerElement, map, onPickupRef.current);
    }

    const cleanup = () => {
        removeListeners();
        const root = reactRootRef.current;
        reactRootRef.current = null;

        // React root must unmount BEFORE marker removal
        // (avoids detached-node warning).
        window.setTimeout(() => {
            if (root) root.unmount();
            marker.remove();
        }, 0);
    };

    return cleanup;
};

export default addAvatarMarker;
