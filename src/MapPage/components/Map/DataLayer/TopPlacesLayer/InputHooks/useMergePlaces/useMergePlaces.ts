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

        return [...dedupedViewportPlaces, ...nearbyPlaces];
    }, [dedupedViewportPlaces, nearbyPlaces]);

    return mergedPlaces;
};

export default useMergePlaces;
