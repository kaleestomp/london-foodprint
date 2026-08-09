import React, { useEffect, useRef, useState, useCallback } from 'react'; 
import L from 'leaflet';

import getVisibleMapTargetScreenPoint from '../MapNavigation/getVisibleMapTargetScreenPoint';
import { type LatLng, type Point } from '../config';
import { usePullUpPanelMetrics } from '../../PullUpPanel/SnapHooks/PullUpPanelSnapContext';
import { useAppUI } from '../../../../context/AppUIContext';
import { useBubbleAvatarState } from '../BubbleAvatarStateContext';

type props = {
    mapRef: React.RefObject<L.Map | null>;
    targetLatLng: LatLng | null;
    token: number | null;
};
const useFlyBubbleToLocation = ({ mapRef, targetLatLng, token }: props) => { 

    const { resetBubbleToHome, handleDropLatLng, droppedPos } = useBubbleAvatarState();

    const { isMobile } = useAppUI();
    const { panelHeight, translateY } = usePullUpPanelMetrics();

    // Handel Fly Bubble to User Location Logic (LIVE / GEOSEARCH)
    // ==========================================================
    const [flyOutTo, setFlyOutTo] = useState<Point | null>(null);
    const pendingTargetLatLngRef = useRef<LatLng | null>(null);
    const handledFlightTokenRef = useRef<number | null>(null);
    // Calculate the screen point to fly the bubble to
    const startFlight = useCallback(() => {
        if (!targetLatLng || !mapRef.current) return;

        const map = mapRef.current;
        const rect = map.getContainer().getBoundingClientRect();
        const latLng = L.latLng(targetLatLng.lat, targetLatLng.lng);
        const point = map.latLngToContainerPoint(latLng);
        const targetScreenPoint = getVisibleMapTargetScreenPoint(map, isMobile, panelHeight, translateY);
        const resetFrom = droppedPos
            ? {
                x: rect.left + droppedPos.x,
                y: rect.top + droppedPos.y,
            }
            : undefined;

        resetBubbleToHome(resetFrom); // Swap with undefined to disable fly-in animation
        pendingTargetLatLngRef.current = { lat: latLng.lat, lng: latLng.lng };
        setFlyOutTo({
            x: targetScreenPoint?.x ?? rect.left + point.x,
            y: targetScreenPoint?.y ?? rect.top + point.y,
        });
    }, [mapRef, targetLatLng, droppedPos, resetBubbleToHome, isMobile, panelHeight, translateY]);
    
    // Handle the drop pin logic when the flight animation completes
    const dropOnEndFlight = useCallback(() => {
        const pendingTargetLatLng = pendingTargetLatLngRef.current;
        const map = mapRef.current;
        if (!pendingTargetLatLng || !map) return;

        // Handle Bubble Drop Logic
        handleDropLatLng(map, pendingTargetLatLng.lat, pendingTargetLatLng.lng);
    }, [handleDropLatLng, mapRef]);
    // Clear all Bubble Flight States at end of flight animation
    const clear = useCallback(() => {
        setFlyOutTo(null);
        pendingTargetLatLngRef.current = null;
    }, []);
    
    // EXECUTION LOGIC
    // ==========================================================
    // useEffect to fly bubble to user location
    useEffect(() => {
        if (!token || handledFlightTokenRef.current === token) return;
        handledFlightTokenRef.current = token;
        startFlight();
    }, [token, startFlight]);

    // useEffect to clear flight state after a drop occurs
    useEffect(() => {
        // Only clear the programmatic flight once a real drop lands on the map.
        // Clearing on null would cancel an in-flight programmatic animation.
        if (!droppedPos) return;
        clear();
    }, [clear, droppedPos]);

    return  {
        flyOutTo,
        dropOnEndFlight,
    }

}

export default useFlyBubbleToLocation;
