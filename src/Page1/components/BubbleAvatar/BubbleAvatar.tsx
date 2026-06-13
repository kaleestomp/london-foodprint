import React, { useState, useCallback, useEffect, useMemo } from 'react'; 
import L from 'leaflet';

import { type LatLng, SEARCH_RADIUS } from './config';

import BubbleHome from './BubbleAvatarHome/BubbleAvatarHome';
import useBubbleDrop from './useDragAndDrop/useBubbleDrop';
import BubbleHomeGhost from './BubbleHomeGhost/BubbleHomeGhost';
import BubbleEdgeIndicator from './BubbleEdgeIndicator/BubbleEdgeIndicator';

const BubbleAvatar: React.FC<{ 
    mapRef?: React.RefObject<L.Map | null>;
    setSearchMask: React.Dispatch<React.SetStateAction<{ center: LatLng; radiusM: number } | null>> 
}> = ({ mapRef, setSearchMask }) => { 

    const [droppedPos, setDroppedPos]  = useState<LatLng | null>(null);
    // Screen coordinate where pickup was triggered — mounts BubbleButton there
    // instead of its home position and auto-starts the drag.
    const [pickupPos, setPickupPos]    = useState<{ x: number; y: number } | null>(null);
    const [flyInFrom, setFlyInFrom]    = useState<{ x: number; y: number } | null>(null);
    const [isDraggingButton, setIsDraggingButton] = useState(false);
    const [isNearHome, setIsNearHome]  = useState(false);

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
    const handleFlyInComplete = useCallback(() => {
        setFlyInFrom(null);
    }, []);
    const handleDrop = useCallback((lat: number, lng: number) => {
        setDroppedPos({ lat, lng });
        setPickupPos(null);
        setFlyInFrom(null);
        setIsDraggingButton(false); // ghost must clear when avatar lands on map
    }, []);
    // Off-map release in pickup mode: clear pickupPos so button jumps to home
    const handleDropCancel = useCallback(() => {
        setPickupPos(null);
        setFlyInFrom(null);
    }, []);

    useBubbleDrop(mapRef, droppedPos, handlePickup);

    const isDropped = droppedPos !== null;
    const searchMask = useMemo(
        () => (droppedPos ? { center: droppedPos, radiusM: SEARCH_RADIUS } : null),
        [droppedPos],
    );

    useEffect(() => {
        setSearchMask(searchMask);
    }, [searchMask, setSearchMask]);

    return (  
        <>
            {/* key forces a fresh Framer Motion instance when switching between
                home mode and pickup mode so motion values reset cleanly */}
            {!isDropped && (
                <BubbleHome
                    key={pickupPos ? 'pickup' : 'home'}
                    mapRef={mapRef}
                    onDrop={handleDrop}
                    onDropCancel={handleDropCancel}
                    onDraggingChange={setIsDraggingButton}
                    onNearHomeChange={setIsNearHome}
                    pickupFrom={pickupPos ?? undefined}
                    flyInFrom={flyInFrom ?? undefined}
                    onFlyInComplete={handleFlyInComplete}
                />
            )}
            {isDraggingButton && (
                <BubbleHomeGhost isNearHome={isNearHome} />
            )}
            {isDropped && droppedPos && (
                <BubbleEdgeIndicator
                    mapRef={mapRef}
                    droppedPos={droppedPos}
                    onPickup={handlePickup}
                    onResetHome={handleResetHome}
                />
            )}
        </>
    );
}

export default BubbleAvatar;

