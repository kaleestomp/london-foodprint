import { type TileMarkerRegistry } from '../useDensityLayer/useDensityLayer';
import { type PlaceMarkerRegistry } from '../usePlacesLayer/usePlacesLayer';
import { type TileDensity } from '../../../../../request/useRequestTiles/request';

const sortPlaceMarkerRegistry = ( 
    newDensityTiles: TileDensity[],
    prevPlaceMarkers: PlaceMarkerRegistry 
) : { outgoings: PlaceMarkerRegistry, retained: TileMarkerRegistry } => {

    const outgoings = new Map(prevPlaceMarkers);
    const retained: TileMarkerRegistry = new Map();

    // Re-key retained singleton markers to the current response tile IDs.
    const newTileBySingletonId = new Map<string, string>();
    newDensityTiles.forEach((d) => {
        const singletonId = d.singleton?.id;
        if (singletonId) newTileBySingletonId.set(singletonId, d.tile);
    });

    // Re-key retained singleton markers to the current response tile IDs.
    prevPlaceMarkers.forEach((Marker, placeId) => {
        const tileId = newTileBySingletonId.get(placeId);
        if (tileId !== undefined) {
            outgoings.delete(placeId);
            retained.set(tileId, { Marker, SingletonId: placeId});
        }
    });

    // console.log('retained', retained);
    // console.log('newTileBySingletonId', newTileBySingletonId);
    return { outgoings, retained };

};

export default sortPlaceMarkerRegistry;
