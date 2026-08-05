import L from 'leaflet';
import { latLngToCell } from 'h3-js';
import { type TilePlacePreview } from '../../../../../../request/useRequestTiles/request';


type Out = Map<string, { dx: number; dy: number }> | undefined;
const getFlyInOffsetOnEntry = (
    map: L.Map,
    places: TilePlacePreview[],
    resolution: number,
    outgoing: Map<string, L.Marker>,
): Out => {

    // NO OUTGOING TILES TO FLY FROM
    if (!outgoing.size) return undefined;

    const offsets = new Map<string, { dx: number; dy: number }>();
    places.forEach((place) => {
        try {
            // Associate Place Marker to H3 Tile
            const tile = latLngToCell(place.lat, place.lon, resolution);
            const tileMarker = outgoing.get(tile);
            if (!tileMarker) return; 
            // Fly-in animation skipped if host tile is not present in outgoing tiles

            // CONVERT LAT-LON TO PX COORDINATES
            const tilePt = map.latLngToContainerPoint(tileMarker.getLatLng());
            const placePt = map.latLngToContainerPoint(L.latLng(place.lat, place.lon));

            // LOG X/Y OFFSET VALUES (PLACE MARKER -> TILE MARKER)
            offsets.set(place.id, { dx: tilePt.x - placePt.x, dy: tilePt.y - placePt.y });

        } catch { /* skip edge cells */ }
    });
    
    return offsets.size > 0 ? offsets : undefined;
};

export default getFlyInOffsetOnEntry;