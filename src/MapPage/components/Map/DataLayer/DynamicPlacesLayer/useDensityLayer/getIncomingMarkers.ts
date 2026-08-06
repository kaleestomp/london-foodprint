import { type TileDensity } from '../../../../../request/useRequestTiles/request';
import { type TileMarkerRegistry } from '../useDensityLayer/useDensityLayer';

const getIncomingMarkers = (
    tiles: TileDensity[],
    markerRegistry: TileMarkerRegistry,
): TileDensity[] => {
    const oldSingletonIdSet = new Set(Array.from(markerRegistry.values())
        .map(({ SingletonId }) => SingletonId).filter(Boolean) as string[]);

    const incomings = tiles.filter((d) => {
        const SingletonId = d.singleton?.id;
        if (!(SingletonId && oldSingletonIdSet.has(SingletonId))) 
            return true;
    });

    return incomings;
};

export default getIncomingMarkers;
