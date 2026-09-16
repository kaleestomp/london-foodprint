import React, { useEffect, useRef, useState, useCallback } from 'react'; 
import type * as maplibregl from 'maplibre-gl';

import { useBubbleAvatarState } from '../BubbleAvatarStateContext';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import getCurrentScreenXY from '../Searchmask/getCurrentScreenXY';
import { type LocationTarget, type Point } from '../config';

type props = {
    mapRef: React.RefObject<maplibregl.Map | null>;
    targetLocation: LocationTarget | null;
    token: number | null;
};
const useFlyBubbleToLocation = ({ mapRef, targetLocation, token }: props) => { 

    const { resetBubbleToHome, handleDropLatLng } = useBubbleAvatarState();
    const { searchMask } = useSearchFilters();
    const { lat, lng } = searchMask?.center ?? { lat: undefined, lng: undefined };
    const isDropped = lat !== undefined && lng !== undefined;
    // const currentScrPos = useGetCurrentScreenXY(mapRef, searchMask?.center);
    // Handel Fly Bubble to User Location Logic (LIVE / GEOSEARCH)
    // ==========================================================
    const [flyOutTo, setFlyOutTo] = useState<Point | null>(null);
    const pendingTargetLatLngRef = useRef<LocationTarget | null>(null);
    const handledFlightTokenRef = useRef<number | null>(null);
    // CLEAR flight state after a drop occurs
    // Only clear the programmatic flight once a real drop lands on the map.
    // Clearing on null would cancel an in-flight programmatic animation.
    const clear = useCallback(() => {
        setFlyOutTo(null);
        pendingTargetLatLngRef.current = null;
    }, []);
    // Calculate the screen point to fly the bubble to
    const startFlight = useCallback(() => {
        if (!targetLocation || !mapRef.current) 
            return;
        const map = mapRef.current;
        const rect = map.getContainer().getBoundingClientRect();
        const screenXY = isDropped ? getCurrentScreenXY(mapRef, lat, lng, rect) : undefined;
        resetBubbleToHome( screenXY ); // Swap with undefined to disable fly-in animation

        const projectedTarget = map.project([targetLocation.lng, targetLocation.lat]);
        pendingTargetLatLngRef.current = targetLocation;
        setFlyOutTo({
            x: rect.left + projectedTarget.x,
            y: rect.top + projectedTarget.y,
        });
    }, [isDropped, mapRef, targetLocation, lat, lng, resetBubbleToHome]);
    
    // Handle the drop pin logic when the flight animation completes
    const dropOnEndFlight = useCallback(() => {
        const pendingTargetLatLng = pendingTargetLatLngRef.current;
        const map = mapRef.current;
        if (!pendingTargetLatLng || !map) return;

        // Handle Bubble Drop Logic
        clear();
        handleDropLatLng(pendingTargetLatLng.lat, pendingTargetLatLng.lng, {
            type: pendingTargetLatLng.searchType,
            geometry: pendingTargetLatLng.geometry,
        });
    }, [clear, handleDropLatLng, mapRef]);
    
    // EXECUTION LOGIC
    // ==========================================================
    // useEffect to fly bubble to user location
    useEffect(() => {
        if (!token || handledFlightTokenRef.current === token) return;
        handledFlightTokenRef.current = token;
        startFlight();
    }, [token, startFlight]);

    return  {
        flyOutTo,
        dropOnEndFlight,
    }

}

export default useFlyBubbleToLocation;
