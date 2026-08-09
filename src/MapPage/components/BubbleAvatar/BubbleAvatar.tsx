import React, { memo, useCallback } from 'react';

import BubbleHome from './BubbleAvatarHome/BubbleAvatarHome';
import onAutoLocation from './onAutoLocation/onAutoLocation';
import useAvatarMapLayer from './useAvatarMapLayer/useAvatarMapLayer';
import { useBubbleAvatarState } from './BubbleAvatarStateContext';
import BubbleHomeGhost from './BubbleHomeGhost/BubbleHomeGhost';
import BubbleEdgeIndicator from './BubbleEdgeIndicator/BubbleEdgeIndicator';

import './BubbleAvatar.css';

const BubbleAvatar: React.FC<{
    mapRef: React.RefObject<L.Map | null>;
}> = ({ mapRef }) => {

    const { droppedPos, pickupPos, isDragging, flyInFrom, resetBubbleToHome } = useBubbleAvatarState();

    // HANDLE AUTO LOCATION ON GEOSEARCH
    const { flyOutTo, dropOnEndFlight } = onAutoLocation({ mapRef });

    // ADD AVATAR TO MAP ON DROPPED MODE
    useAvatarMapLayer(mapRef);

    const handleResetHomeScenarios = useCallback(() => {
        if (pickupPos) {
            resetBubbleToHome(pickupPos);

        } else if (mapRef.current && droppedPos) {
            resetBubbleToHome(droppedPos);

        } else {
            resetBubbleToHome();
        }

    }, [pickupPos, resetBubbleToHome, droppedPos]);

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

export default memo(BubbleAvatar);
