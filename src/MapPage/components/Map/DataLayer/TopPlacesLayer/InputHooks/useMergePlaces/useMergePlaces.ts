import { useMemo } from 'react';
import { type TopPlaceItem } from '../../../../../../request/useRequestTopPlaces/request';

type Props = {
    viewportPlaces: TopPlaceItem[] | null;
    nearbyPlaces: TopPlaceItem[] | null;
};

const useMergePlaces = ({ viewportPlaces, nearbyPlaces }: Props): TopPlaceItem[] => {
    const dedupedViewportPlaces = useMemo(() => {
        if (!viewportPlaces) return [];
        if (!nearbyPlaces?.length) return viewportPlaces;

        const nearbyIds = new Set(nearbyPlaces.map((place) => place.id));
        return viewportPlaces.filter((place) => !nearbyIds.has(place.id));
    }, [viewportPlaces, nearbyPlaces]);

    const mergedPlaces = useMemo(() => {
        if (!dedupedViewportPlaces.length) return nearbyPlaces ?? [];
        if (!nearbyPlaces?.length) return dedupedViewportPlaces;

        // DELIBRATELY KEEP NEARBY PLACES FIRST 
        // SO RANK TAG ONLY RECOGNIZES THE TOP 20 FROM NEARBY SEARCH
        return [...nearbyPlaces, ...dedupedViewportPlaces];
        
    }, [dedupedViewportPlaces, nearbyPlaces]);

    return mergedPlaces;
};

export default useMergePlaces;
