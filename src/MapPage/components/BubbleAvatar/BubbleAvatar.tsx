import React, { memo, useCallback } from 'react';
import type maplibregl from 'maplibre-gl';

import { useSearchFilters } from '../../../context/SearchFiltersContext';
import { useBubbleAvatarState } from './BubbleAvatarStateContext';
import BubbleHome from './BubbleAvatarHome/BubbleAvatarHome';
import onAutoLocation from './onAutoLocation/onAutoLocation';
import useAvatarMapLayer from './useAvatarMapLayer/useAvatarMapLayer';

import BubbleHomeGhost from './BubbleHomeGhost/BubbleHomeGhost';
import BubbleEdgeIndicator from './BubbleEdgeIndicator/BubbleEdgeIndicator';
// import useGetCurrentScreenXY from './Searchmask/useGetCurrentScreenXY';
import getCurrentScreenXY from './Searchmask/getCurrentScreenXY';

import './BubbleAvatar.css';

const BubbleAvatar: React.FC<{
    mapRef: React.RefObject<maplibregl.Map | null>;
}> = ({ mapRef }) => {

    const { pickupPos, isDragging, flyInFrom, resetBubbleToHome } = useBubbleAvatarState();
    const { searchMask } = useSearchFilters();
    const { lat, lng } = searchMask?.center ?? { lat: undefined, lng: undefined };
    // const currentScrPos = useGetCurrentScreenXY(mapRef, searchMask?.center);

    // HANDLE AUTO LOCATION ON GEOSEARCH
    const { flyOutTo, dropOnEndFlight } = onAutoLocation({ mapRef });

    // ADD AVATAR TO MAP ON DROPPED MODE
    useAvatarMapLayer(mapRef);

    const handleResetHomeScenarios = useCallback(() => {
        if (pickupPos) {
            resetBubbleToHome(pickupPos);

        } else if (mapRef.current && lat !== undefined && lng !== undefined) {
            const screenXY = getCurrentScreenXY(mapRef, lat, lng);
            resetBubbleToHome(screenXY);

        } else {
            resetBubbleToHome();
        }

    }, [pickupPos, resetBubbleToHome, lat, lng]);

    const isDropped = lat !== undefined && lng !== undefined;
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
            {isDropped && (
                <BubbleEdgeIndicator
                    mapRef={mapRef}
                />
            )}
        </div>
    );
}

export default memo(BubbleAvatar);
