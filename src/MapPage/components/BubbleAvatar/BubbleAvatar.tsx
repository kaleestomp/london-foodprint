import React, { useState, useCallback } from 'react'; 

import { type LatLng } from './config';

import BubbleHome from './BubbleAvatarHome/BubbleAvatarHome';
import useHandleUserLocation from './handleUserLocation/useHandleUserLocation';
import useBubbleDrop from './useDragAndDrop/useBubbleDrop';
import useUpdateSearchMask from './useUpdateSearchMask';

import BubbleHomeGhost from './BubbleHomeGhost/BubbleHomeGhost';
import BubbleEdgeIndicator from './BubbleEdgeIndicator/BubbleEdgeIndicator';

import './BubbleAvatar.css';

const BubbleAvatar: React.FC<{ 
    mapRef: React.RefObject<L.Map | null>;
}> = ({ mapRef }) => { 

    // World coordinate where drop off was triggered
    const [droppedPos, setDroppedPos]  = useState<LatLng | null>(null);
    // Handle Search Mask Update to new positions
    useUpdateSearchMask(droppedPos);

    // Screen coordinate where pickup was triggered — mounts BubbleButton there
    // instead of its home position and auto-starts the drag.
    const [pickupPos, setPickupPos]    = useState<{ x: number; y: number } | null>(null);
    // Whether the button is currently being dragged by the user
    const [isDragging, setIsDragging] = useState(false);
    // Whether the button is currently near its home position
    // (used to determine whether to show the ghost)
    const [isNearHome, setIsNearHome]  = useState(false);
    // Screen coordinate where the button should fly in from when returning home
    const [flyInFrom, setFlyInFrom]    = useState<{ x: number; y: number } | null>(null);
    // Reset all floating state to HOME
    const resetBubbleToHome = useCallback((from?: { x: number; y: number }) => {
        setDroppedPos(null);
        setPickupPos(null);
        setFlyInFrom(from ?? null);
        setIsDragging(false);
    }, []);
    // Handle user drop event: set real world coordinates and clear states
    const handleDrop = useCallback((lat: number, lng: number) => {
        setDroppedPos({ lat, lng });
        setPickupPos(null);
        setFlyInFrom(null);
        setIsDragging(false);
    }, []);
    const handlePickup = useCallback((x: number, y: number) => {
        setDroppedPos(null);
        setPickupPos({ x, y });
        setFlyInFrom(null);
    }, []);

    // Handle AUTO DROP (LIVE / GEOSEARCH)
    const { flyOutTo, dropOnEndFlight } = useHandleUserLocation({
        mapRef,
        droppedPos,
        handleDrop,
        resetBubbleToHome,
    });
    // Handle MANUAL DROP (DRAG & DROP)
    useBubbleDrop(mapRef, droppedPos, handlePickup);


    const handleResetHomeScenarios = useCallback(() => {
        if (pickupPos) {
            resetBubbleToHome(pickupPos);
            return;
        }
        const map = mapRef.current;
        if (map && droppedPos) {
            const pt = map.latLngToContainerPoint([droppedPos.lat, droppedPos.lng]);
            const rect = map.getContainer().getBoundingClientRect();
            resetBubbleToHome({ x: rect.left + pt.x, y: rect.top + pt.y });
            return;
        }
        resetBubbleToHome();
    }, [pickupPos, resetBubbleToHome, mapRef, droppedPos]);
    const handleFlyInComplete = useCallback(() => {
        setFlyInFrom(null);
    }, []);
    // Off-map release in pickup mode: clear pickupPos so button jumps to home
    const handleDropCancel = useCallback(() => {
        setPickupPos(null);
        setFlyInFrom(null);
    }, []);
    

    const isDropped = droppedPos !== null;
    const isAwayFromHome = isDropped || isDragging || pickupPos !== null;
    return (  
        <div className="bubble-avatar-root">
            {/* key forces a fresh Framer Motion instance when switching between
                home mode and pickup mode so motion values reset cleanly */}
            {!isDropped && (
                <BubbleHome
                    key={pickupPos ? 'pickup' : 'home'}
                    mapRef={mapRef}
                    drag={{
                        onDrop: handleDrop,
                        onDropCancel: handleDropCancel,
                        setIsDragging,
                        onNearHomeChange: setIsNearHome,
                    }}
                    state={{
                        isNearHome,
                        pickupFrom: pickupPos ?? undefined,
                    }}
                    flight={{
                        flyInFrom: flyInFrom ?? undefined,
                        onFlyInComplete: handleFlyInComplete,
                        flyOutTo: flyOutTo ?? undefined,
                        onFlyOutComplete: dropOnEndFlight,
                    }}
                />
            )}
            {isAwayFromHome && (
                <BubbleHomeGhost
                    isNearHome={isNearHome}
                    onResetHome={handleResetHomeScenarios}
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
