import React, { useState, useCallback, useEffect, useMemo } from 'react'; 

import { type LatLng, SEARCH_RADIUS } from './config';

import BubbleHome from './BubbleAvatarHome/BubbleAvatarHome';
import useBubbleDrop from './useDragAndDrop/useBubbleDrop';
import useMapPanToLocation from './handleUserLocation/useMapPanToLocation';
import useFlightAnimationToPoint from './handleUserLocation/useFlightAnimationToPoint';
import BubbleHomeGhost from './BubbleHomeGhost/BubbleHomeGhost';
import BubbleEdgeIndicator from './BubbleEdgeIndicator/BubbleEdgeIndicator';
import './BubbleAvatar.css';

const BubbleAvatar: React.FC<{ 
    mapRef: React.RefObject<L.Map | null>;
    setSearchMask: React.Dispatch<React.SetStateAction<{ center: LatLng; radiusM: number } | null>>;
    liveLocation?: { lat: number; lng: number; token: number } | null;
}> = ({ mapRef, setSearchMask, liveLocation }) => { 

    const [droppedPos, setDroppedPos]  = useState<LatLng | null>(null);
    // Screen coordinate where pickup was triggered — mounts BubbleButton there
    // instead of its home position and auto-starts the drag.
    const [pickupPos, setPickupPos]    = useState<{ x: number; y: number } | null>(null);
    const [flyInFrom, setFlyInFrom]    = useState<{ x: number; y: number } | null>(null);
    const [isDraggingButton, setIsDraggingButton] = useState(false);
    const [isNearHome, setIsNearHome]  = useState(false);

    const [programmaticFlightToken, setProgrammaticFlightToken] = useState<number | null>(null);

    const resetFloatingState = useCallback(() => {
        setDroppedPos(null);
        setPickupPos(null);
        setFlyInFrom(null);
        setIsDraggingButton(false);
    }, []);

    const handleDrop = useCallback((lat: number, lng: number) => {
        setDroppedPos({ lat, lng });
        setPickupPos(null);
        setFlyInFrom(null);
        setIsDraggingButton(false);
    }, []);

    // Memoize targetLatLng to prevent unnecessary re-creation and infinite loops
    const targetLatLng = useMemo(
        () => liveLocation ? { lat: liveLocation.lat, lng: liveLocation.lng } : null,
        [liveLocation?.lat, liveLocation?.lng]
    );

    const handleMapPanReady = useCallback(() => {
        setProgrammaticFlightToken(liveLocation?.token ?? null);
    }, [liveLocation?.token]);

    useMapPanToLocation({
        mapRef,
        targetLatLng,
        token: liveLocation?.token ?? null,
        onReady: handleMapPanReady,
    });

    const {
        flyOutTo,
        startFlight,
        handleAnimationComplete,
        clear: clearFlight,
    } = useFlightAnimationToPoint({
        mapRef,
        targetLatLng,
        onAnimationComplete: handleDrop,
        onStateReset: resetFloatingState,
    });

    useEffect(() => {
        if (programmaticFlightToken) {
            startFlight();
        }
    }, [programmaticFlightToken, startFlight]);

    useEffect(() => {
        // Only clear the programmatic flight once a real drop lands on the map.
        // Clearing on null would cancel an in-flight programmatic animation.
        if (!droppedPos) return;
        clearFlight();
    }, [clearFlight, droppedPos]);

    const handlePickup = useCallback((x: number, y: number) => {
        setDroppedPos(null);
        setPickupPos({ x, y });
        setFlyInFrom(null);
    }, []);
    const handleResetHome = useCallback((from?: { x: number; y: number }) => {
        setDroppedPos(null);
        setPickupPos(null);
        setFlyInFrom(from ?? null);
        setIsDraggingButton(false);
    }, []);
    const handleResetHomeAnytime = useCallback(() => {
        if (pickupPos) {
            handleResetHome(pickupPos);
            return;
        }

        const map = mapRef.current;
        if (map && droppedPos) {
            const pt = map.latLngToContainerPoint([droppedPos.lat, droppedPos.lng]);
            const rect = map.getContainer().getBoundingClientRect();
            handleResetHome({ x: rect.left + pt.x, y: rect.top + pt.y });
            return;
        }

        handleResetHome();
    }, [pickupPos, handleResetHome, mapRef, droppedPos]);
    
    const handleFlyInComplete = useCallback(() => {
        setFlyInFrom(null);
    }, []);
    // Off-map release in pickup mode: clear pickupPos so button jumps to home
    const handleDropCancel = useCallback(() => {
        setPickupPos(null);
        setFlyInFrom(null);
    }, []);

    useBubbleDrop(mapRef, droppedPos, handlePickup);

    const isDropped = droppedPos !== null;
    const isAwayFromHome = isDropped || isDraggingButton || pickupPos !== null;
    const searchMask = useMemo(
        () => (droppedPos ? { center: droppedPos, radiusM: SEARCH_RADIUS } : null),
        [droppedPos],
    );

    useEffect(() => {
        setSearchMask(searchMask);
    }, [searchMask, setSearchMask]);

    return (  
        <div className="bubble-avatar-root">
            {/* key forces a fresh Framer Motion instance when switching between
                home mode and pickup mode so motion values reset cleanly */}
            {!isDropped && (
                <BubbleHome
                    key={pickupPos ? 'pickup' : 'home'}
                    mapRef={mapRef}
                    onDrop={handleDrop}
                    onDropCancel={handleDropCancel}
                    onDraggingChange={setIsDraggingButton}
                    isNearHome={isNearHome}
                    onNearHomeChange={setIsNearHome}
                    pickupFrom={pickupPos ?? undefined}
                    flyInFrom={flyInFrom ?? undefined}
                    onFlyInComplete={handleFlyInComplete}
                    flyOutTo={flyOutTo ?? undefined}
                    onFlyOutComplete={handleAnimationComplete}
                />
            )}
            {isAwayFromHome && (
                <BubbleHomeGhost
                    isNearHome={isNearHome}
                    onResetHome={handleResetHomeAnytime}
                />
            )}
            {isDropped && droppedPos && (
                <BubbleEdgeIndicator
                    mapRef={mapRef}
                    droppedPos={droppedPos}
                    onPickup={handlePickup}
                />
            )}
        </div>
    );
}

export default BubbleAvatar;

