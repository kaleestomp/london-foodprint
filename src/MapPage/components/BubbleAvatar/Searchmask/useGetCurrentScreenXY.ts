import { useEffect, useRef, useState, useCallback } from 'react';
import type maplibregl from 'maplibre-gl';
import getCurrentScreenXY from './getCurrentScreenXY';

type Point = { x: number; y: number };

const useGetCurrentScreenXY = (
    mapRef: React.RefObject<maplibregl.Map | null>,
    latLng?: { lat: number; lng: number } | null
) => {

    // Cached container rect — the container doesn't move during pan/zoom,
    // so we only re-read it on resize rather than on every map move event.
    const containerRectRef  = useRef<DOMRect | undefined>(undefined);
    const [currentScrPos, setCurrentScrPos] = useState<Point | undefined>(undefined);

    const arePointsEqual = (a: Point | undefined, b: Point | undefined): boolean => {
        if (!a && !b) return true;
        if (!a || !b) return false;
        // Ignore sub-pixel jitter to avoid noisy re-renders while panning.
        return Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5;
    };

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

    const update = useCallback(() => {
        if (latLng?.lat == null || latLng?.lng == null) return;
        const rect = containerRectRef.current ?? mapRef.current?.getContainer().getBoundingClientRect();
        containerRectRef.current = rect; // Cache the rect for future calls

        const next = getCurrentScreenXY(mapRef, latLng.lat, latLng.lng, rect);
        setCurrentScrPos((prev) => (arePointsEqual(prev, next) ? prev : next));
    }, [latLng?.lat, latLng?.lng]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !latLng) {
            setCurrentScrPos((prev) => (prev === undefined ? prev : undefined));
            return;
        }
        map.on('move', update);
        map.on('zoom', update);
        window.addEventListener('resize', update, { passive: true });
        update();

        return () => {
            map.off('move', update);
            map.off('zoom', update);
            window.removeEventListener('resize', update);
        };
    }, [latLng?.lat, latLng?.lng, update]);

    return currentScrPos;
};

export default useGetCurrentScreenXY;
