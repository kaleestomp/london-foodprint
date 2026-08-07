import { type TileMarkerRegistry } from '../useDensityLayer/useDensityLayer';
import { type PlaceMarkerRegistry } from '../usePlacesLayer/usePlacesLayer';

const sortTileMarkerRegistry = ( 
    prevMarkers: TileMarkerRegistry 
) : { outgoings: TileMarkerRegistry, retained: PlaceMarkerRegistry } => {

    const outgoings = new Map(prevMarkers);
    const retained: PlaceMarkerRegistry = new Map();

    // Re-key retained singleton markers to the current response tile IDs.
    prevMarkers.forEach(({ Marker, SingletonId }, prevTileId) => {
        if (SingletonId) {
            outgoings.delete(prevTileId);
            retained.set(SingletonId, Marker);
        }
    });

    return { outgoings, retained };

};

export default sortTileMarkerRegistry;
