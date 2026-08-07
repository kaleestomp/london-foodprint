import { useEffect, useRef, useMemo } from 'react';


const useTopPlacesChange = (
    topPlaceIdSet: Set<string> | undefined
): boolean => {

    const prevTopPlaceIdsKeyRef = useRef('');
    const topPlaceIdsKey = useMemo(() =>
        topPlaceIdSet?.size
            ? [...topPlaceIdSet].sort((left, right) => left.localeCompare(right)).join('|')
            : '',
        [topPlaceIdSet]);
    const changed = prevTopPlaceIdsKeyRef.current !== topPlaceIdsKey;

    useEffect(() => {
        prevTopPlaceIdsKeyRef.current = topPlaceIdsKey;
    }, [topPlaceIdsKey]);

    return changed;
};

export default useTopPlacesChange;
