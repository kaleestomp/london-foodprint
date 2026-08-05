import { useEffect, useRef, useMemo } from 'react';


const useTopPlacesChange = (activeTopPlaceIds: string[]): boolean => {

    const prevTopPlaceIdsKeyRef = useRef('');
    const topPlaceIdsKey = useMemo(() =>
        activeTopPlaceIds.length
            ? [...activeTopPlaceIds].sort((left, right) => left.localeCompare(right)).join('|')
            : '',
        [activeTopPlaceIds]);
    const changed = prevTopPlaceIdsKeyRef.current !== topPlaceIdsKey;

    useEffect(() => {
        prevTopPlaceIdsKeyRef.current = topPlaceIdsKey;
    }, [topPlaceIdsKey]);

    return changed;
};

export default useTopPlacesChange;
