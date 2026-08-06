import L from 'leaflet';
import { type TileDensity, type TilePlacePreview } from '../../../../../../request/useRequestTiles/request';
import { type TileMarkerRegistry } from '../useDensityLayer';
import sortTiles from './sortTiles';
import addDensityMarkers from './addDensityMarkers';
import addPlaceMarkers from '../../usePlacesLayer/placeMarkers/addPlaceMarkers';

type Props = {
    layer: L.Map | L.LayerGroup,
    tiles: TileDensity[],
    resolution: number,
    // checkedTiles: Set<string>,
    markerRegistry: TileMarkerRegistry,
    startOffsets?: Map<string, { dx: number; dy: number }>,
}
const addMarkers = ({ layer, tiles, resolution, markerRegistry, startOffsets }: Props): void => {

    // SYNC checkedTilesRef so subsequent addMarkers calls skip already-parsed tiles.
    // Without this, addMarkers sees an empty set and re-creates duplicate markers for
    // every tile, orphaning the originals in the layer with no way to remove them.
    const newTiles = tiles.filter(d => !markerRegistry.has(d.tile));
    if (!newTiles.length) return;
    // const newTiles = tiles.filter(d => !checkedTiles.has(d.tile));
    // if (!newTiles.length) return ;
    // newTiles.forEach((d) => checkedTiles.add(d.tile));

    // SORT TILES 
    const { densityTiles, singletons } = sortTiles(newTiles);

    // ADD DENSITY MARKERS
    if (densityTiles.length) {
        const newDensityMarkers = addDensityMarkers(layer, densityTiles, resolution, startOffsets);

        newDensityMarkers.forEach(({ TileId, Marker }) => {
            markerRegistry.set(TileId, { Marker: Marker, SingletonId: null })
        });
    }

    // ADD SINGLETON PLACE MARKERS
    if (singletons.length) {
        const places: TilePlacePreview[] = [];
        const placeByTileId = new Map<string, TilePlacePreview>();
        const tileByPlaceId = new Map<string, string>();

        for (const d of singletons) {
            const place = d.singleton;
            if (!place) continue;
            places.push(place);
            placeByTileId.set(d.tile, place);
            tileByPlaceId.set(place.id, d.tile);
        }

        const startOffsetsMappedToPlaceId = new Map<string, { dx: number; dy: number }>();
        if (startOffsets) {
            for (const [tileId, place] of placeByTileId) {
                const offset = startOffsets.get(tileId);
                if (offset) startOffsetsMappedToPlaceId.set(place.id, offset);
            }
        }

        const newSingletonMarkers = addPlaceMarkers(layer, places, undefined, startOffsetsMappedToPlaceId);

        for (const { PlaceId, Marker } of newSingletonMarkers) {
            const tileId = tileByPlaceId.get(PlaceId);
            if (tileId) markerRegistry.set(tileId, { Marker, SingletonId: PlaceId });
        }
    }
};

export default addMarkers;

