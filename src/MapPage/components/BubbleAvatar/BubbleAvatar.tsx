import React, { useCallback } from 'react'; 

import BubbleHome from './BubbleAvatarHome/BubbleAvatarHome';
import onAutoLocation from './onAutoLocation/onAutoLocation';
import onBubbleDrop from './onBubbleDrop/onBubbleDrop';
import useUpdateSearchMask from './Searchmask/useUpdateSearchMask';
import { useBubbleAvatarState } from './BubbleAvatarStateContext';
import BubbleHomeGhost from './BubbleHomeGhost/BubbleHomeGhost';
import BubbleEdgeIndicator from './BubbleEdgeIndicator/BubbleEdgeIndicator';

import './BubbleAvatar.css';

const BubbleAvatar: React.FC<{ 
    mapRef: React.RefObject<L.Map | null>;
}> = ({ mapRef }) => {

    const { droppedPos, pickupPos, isDragging, flyInFrom, resetBubbleToHome } = useBubbleAvatarState();

    // Handle Search Mask Update to new positions
    useUpdateSearchMask(droppedPos);

    // HANDLE AUTO LOCATION ON GEOSEARCH
    const { flyOutTo, dropOnEndFlight } = onAutoLocation({ mapRef, droppedPos });

    // // HANDLE DROP: Call Nearby Seach and More
    onBubbleDrop(mapRef, droppedPos);

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
                    flight={{
                        flyInFrom: flyInFrom ?? undefined,
                        flyOutTo: flyOutTo ?? undefined,
                        onFlyOutComplete: dropOnEndFlight,
                    }}
                />
            )}
            {isAwayFromHome && (
                <BubbleHomeGhost
                    onResetHome={handleResetHomeScenarios}
                />
            )}
            {isDropped && droppedPos && (
                <BubbleEdgeIndicator
                    mapRef={mapRef}
                />
            )}
        </div>
    );
}

export default BubbleAvatar;
