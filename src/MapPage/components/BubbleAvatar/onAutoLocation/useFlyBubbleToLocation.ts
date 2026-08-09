import React, { useEffect, useRef, useState, useCallback } from 'react'; 
import L from 'leaflet';

import { usePullUpPanelMetrics } from '../../PullUpPanel/SnapHooks/PullUpPanelSnapContext';
import { useIsMobileCtx } from '../../../../context/IsMobileContext';
import { useBubbleAvatarState } from '../BubbleAvatarStateContext';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import getVisibleMapTargetScreenPoint from '../MapNavigation/getVisibleMapTargetScreenPoint';
import getCurrentScreenXY from '../Searchmask/getCurrentScreenXY';
import { type LatLng, type Point } from '../config';

type props = {
    mapRef: React.RefObject<L.Map | null>;
    targetLatLng: LatLng | null;
    token: number | null;
};
const useFlyBubbleToLocation = ({ mapRef, targetLatLng, token }: props) => { 

    const { resetBubbleToHome, handleDropLatLng } = useBubbleAvatarState();
    const { searchMask } = useSearchFilters();
    const { lat, lng } = searchMask?.center ?? { lat: undefined, lng: undefined };
    const isDropped = lat !== undefined && lng !== undefined;
    // const currentScrPos = useGetCurrentScreenXY(mapRef, searchMask?.center);

    const isMobile = useIsMobileCtx();
    const { panelHeight, translateY } = usePullUpPanelMetrics();

    // Handel Fly Bubble to User Location Logic (LIVE / GEOSEARCH)
    // ==========================================================
    const [flyOutTo, setFlyOutTo] = useState<Point | null>(null);
    const pendingTargetLatLngRef = useRef<LatLng | null>(null);
    const handledFlightTokenRef = useRef<number | null>(null);
    // Calculate the screen point to fly the bubble to
    const startFlight = useCallback(() => {
        if (!targetLatLng || !mapRef.current) 
            return;
        const map = mapRef.current;
        const rect = map.getContainer().getBoundingClientRect();
        const screenXY = isDropped ? getCurrentScreenXY(mapRef, lat, lng, rect) : undefined;
        resetBubbleToHome( screenXY ); // Swap with undefined to disable fly-in animation

        const latLng = L.latLng(targetLatLng.lat, targetLatLng.lng);
        const point = map.latLngToContainerPoint(latLng);
        const targetScreenPoint = getVisibleMapTargetScreenPoint(map, isMobile, panelHeight, translateY);
        pendingTargetLatLngRef.current = { lat: latLng.lat, lng: latLng.lng };
        setFlyOutTo({
            x: targetScreenPoint?.x ?? rect.left + point.x,
            y: targetScreenPoint?.y ?? rect.top + point.y,
        });
    }, [mapRef, targetLatLng, lat, lng, resetBubbleToHome, isMobile, panelHeight, translateY]);
    
    // Handle the drop pin logic when the flight animation completes
    const dropOnEndFlight = useCallback(() => {
        const pendingTargetLatLng = pendingTargetLatLngRef.current;
        const map = mapRef.current;
        if (!pendingTargetLatLng || !map) return;

        // Handle Bubble Drop Logic
        handleDropLatLng(pendingTargetLatLng.lat, pendingTargetLatLng.lng);
    }, [handleDropLatLng]);
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
        if (!searchMask?.center) return;
        clear();
    }, [clear, searchMask?.center]);

    return  {
        flyOutTo,
        dropOnEndFlight,
    }

}

export default useFlyBubbleToLocation;
