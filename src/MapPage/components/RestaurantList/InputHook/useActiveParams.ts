import { useEffect, useState } from 'react';
import { type PlacesListParams } from '../../../request/useRequestPlacesList/useRequestInfinitePlacesList';

const useActiveParams = (
    liveParams: PlacesListParams | null,
    liveParamKey: string,
    shouldReset: boolean,
): PlacesListParams | null => {

    const [activeParams, setActiveParams] = useState<PlacesListParams | null>(null);
    const [activeParamKey, setActiveParamKey] = useState('');

    useEffect(() => {
        if (!liveParams) {
            setActiveParams(null);
            setActiveParamKey('');
            return;
        }

        // Keep fetching on the last adopted params while stale updates are paused.
        if (!shouldReset && activeParams) return;
        if (activeParamKey === liveParamKey) return;

        setActiveParams(liveParams);
        setActiveParamKey(liveParamKey);
    }, [shouldReset, activeParamKey, activeParams, liveParamKey, liveParams]);

    return activeParams;
};

export default useActiveParams;