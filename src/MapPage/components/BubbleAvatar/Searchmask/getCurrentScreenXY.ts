import type maplibregl from 'maplibre-gl';
import { checkIsInView, getEdgeState } from '../BubbleEdgeIndicator/getEdgeState';

const getCurrentScreenXY = (
    mapRef: React.RefObject<maplibregl.Map | null>,
    lat: number,
    lng: number,
    rect?: DOMRect | null
): { x: number; y: number } | undefined => {

    const map = mapRef.current;
    const mapRect = rect ?? map?.getContainer().getBoundingClientRect();
    // const rect = rectRef?.current ?? map?.getContainer().getBoundingClientRect();
    // if (rectRef) rectRef.current = rect ?? null; // Cache the rect for future calls
    if (!map || !mapRect) return undefined;
    
    const pt = map.project([lng, lat]);
    const screenX = mapRect.left + pt.x;
    const screenY = mapRect.top + pt.y;
    const W = window.innerWidth;
    const H = window.innerHeight;
    
    const inView = checkIsInView(screenX, screenY, W, H);
    if (!inView) {
        const edgeState = getEdgeState(screenX, screenY, W, H);
        return edgeState 
            ? { x: edgeState.x, y: edgeState.y } 
            : { x: screenX, y: screenY };
    } 
    return { x: screenX, y: screenY };
};

export default getCurrentScreenXY;