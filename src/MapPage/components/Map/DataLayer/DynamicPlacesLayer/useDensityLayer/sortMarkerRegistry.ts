import { type TileDensity } from '../../../../../request/useRequestTiles/request';
import { type TileMarkerRegistry } from './useDensityLayer';

const sortMarkerRegistry = (
    newTiles: TileDensity[],
    prevMarkers: TileMarkerRegistry,
): { outgoings: TileMarkerRegistry, retained: TileMarkerRegistry } => {

    const outgoings = new Map(prevMarkers);
    const retained: TileMarkerRegistry = new Map();

    // Re-key retained singleton markers to the current response tile IDs.
    const newTileBySingletonId = new Map<string, string>();
    newTiles.forEach((d) => {
        const singletonId = d.singleton?.id;
        if (singletonId) newTileBySingletonId.set(singletonId, d.tile);
    });

    prevMarkers.forEach(({ Marker, SingletonId }, prevTileId) => {
        if (SingletonId && newTileBySingletonId.has(SingletonId)) {
            const currentTileId = newTileBySingletonId.get(SingletonId);
            if (currentTileId)
                retained.set(currentTileId, { Marker, SingletonId });

            // Keep this marker on the map: skip outgoing animation/removal.
            outgoings.delete(prevTileId);
        }
    });

    return { outgoings, retained };

};

export default sortMarkerRegistry;
