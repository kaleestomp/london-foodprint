import React, { useEffect, useRef, useState, useCallback } from 'react'; 
import type maplibregl from 'maplibre-gl';

import { useBubbleAvatarState } from '../BubbleAvatarStateContext';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import getCurrentScreenXY from '../Searchmask/getCurrentScreenXY';
import { type LatLng, type Point } from '../config';
import useBottomPadding from '../../MapViewportSync/useBottomPadding/useBottomPadding';
import getPaddedViewportCenterScreenPoint from '../MapNavigation/getPaddedViewportCenterScreenPoint';

type props = {
    mapRef: React.RefObject<maplibregl.Map | null>;
    targetLatLng: LatLng | null;
    token: number | null;
};
const useFlyBubbleToLocation = ({ mapRef, targetLatLng, token }: props) => { 

    const { resetBubbleToHome, handleDropLatLng } = useBubbleAvatarState();
    const { searchMask } = useSearchFilters();
    const { lat, lng } = searchMask?.center ?? { lat: undefined, lng: undefined };
    const isDropped = lat !== undefined && lng !== undefined;
    // const currentScrPos = useGetCurrentScreenXY(mapRef, searchMask?.center);
    const bottomPadding = useBottomPadding(mapRef);

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

        const latLng = { lat: targetLatLng.lat, lng: targetLatLng.lng };
        const paddedCenter = getPaddedViewportCenterScreenPoint(map, bottomPadding);
        pendingTargetLatLngRef.current = { lat: latLng.lat, lng: latLng.lng };
        setFlyOutTo({
            x: paddedCenter.x,
            y: paddedCenter.y,
        });
    }, [mapRef, targetLatLng, lat, lng, resetBubbleToHome, bottomPadding]);
    
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
