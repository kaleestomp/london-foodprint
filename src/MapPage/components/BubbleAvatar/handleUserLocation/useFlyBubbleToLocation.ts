import React, { useEffect, useRef, useState, useCallback } from 'react'; 
import L from 'leaflet';

import getVisibleMapTargetScreenPoint from '../getVisibleMapTargetScreenPoint';
import { type LatLng, type Point } from '../config';
import { useRestaurantPanelSnapState } from '../../RestaurantInfoPanel/RestaurantPanelSnapContext';

type props = {
    mapRef: React.RefObject<L.Map | null>;
    targetLatLng: LatLng | null;
    droppedPos: LatLng | null;
    token: number | null;
    handleDrop: (lat: number, lng: number) => void;
    resetBubbleToHome: (from?: Point) => void;
};
const useFlyBubbleToLocation = ({ 
    mapRef,
    targetLatLng,
    droppedPos,
    token,
    handleDrop,
    resetBubbleToHome,
 }: props) => { 
     const { isMobile, panelHeight, translateY } = useRestaurantPanelSnapState();

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
            ? (() => {
                const droppedPoint = map.latLngToContainerPoint(
                    L.latLng(droppedPos.lat, droppedPos.lng),
                );
                return {
                    x: rect.left + droppedPoint.x,
                    y: rect.top + droppedPoint.y,
                };
            })()
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
        if (!pendingTargetLatLng) return;
        // Handle Bubble Drop Logic
        handleDrop(pendingTargetLatLng.lat, pendingTargetLatLng.lng);
    }, [handleDrop]);
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
