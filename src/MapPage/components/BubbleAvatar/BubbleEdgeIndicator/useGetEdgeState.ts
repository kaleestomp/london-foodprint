import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

import { checkIsInView, getEdgeState } from '../BubbleEdgeIndicator/getEdgeState';
import type { EdgeState } from '../BubbleEdgeIndicator/getEdgeState';

const useGetEdgeState = (
    mapRef: React.RefObject<L.Map | null>,
    latLng?: { lat: number; lng: number } | null
) => {

    // Cached container rect — the container doesn't move during pan/zoom,
    // so we only re-read it on resize rather than on every map move event.
    const containerRectRef  = useRef<DOMRect | null>(null);
    const [edgeState, setEdgeState] = useState<EdgeState>(null);

    // ── Cache container rect; refresh only on resize ───────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const container = map.getContainer();
        const syncRect = () => { containerRectRef.current = container.getBoundingClientRect(); };
        syncRect();
        map.on('resize', syncRect);
        window.addEventListener('resize', syncRect, { passive: true });
        return () => {
            map.off('resize', syncRect);
            window.removeEventListener('resize', syncRect);
        };
    }, [mapRef])

    // ── Track avatar screen position on every map move ─────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !latLng) {
            setEdgeState((prev) => (prev === null ? prev : null));
            return;
        };
        
        const update = () => {
          const rect = containerRectRef.current; 
          if (!rect) return;
          const projected = map.latLngToContainerPoint([latLng.lat, latLng.lng]);
          const sx   = rect.left + projected.x;
          const sy   = rect.top + projected.y;
          const W    = window.innerWidth;
          const H    = window.innerHeight;
    
          const inView = checkIsInView(sx, sy, W, H);
          const nextEdgeState = inView ? null : getEdgeState(sx, sy, W, H);
          setEdgeState(nextEdgeState);
        };
        
        map.on('move', update);
        map.on('zoom', update);
        window.addEventListener('resize', update, { passive: true });
        update(); // evaluate immediately on mount / searchMask change
    
        return () => {
            map.off('move', update);
            map.off('zoom', update);
            window.removeEventListener('resize', update);
        };
      }, [mapRef, latLng?.lat, latLng?.lng]);

    return edgeState;
};

export default useGetEdgeState;
