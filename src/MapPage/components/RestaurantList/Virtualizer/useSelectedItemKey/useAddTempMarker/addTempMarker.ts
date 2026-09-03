import React from 'react';
import maplibregl from 'maplibre-gl';
import { type PlacesListItem } from '../../../../../request/useRequestPlacesList/request';
import TopPlacePin from '../../../../Map/DataLayer/TopPlacesLayer/syncMarkers/markers/TopPlacePin';

const addTempMarker = (
    map: maplibregl.Map,
    item: PlacesListItem,
    selectedMarkerRef: React.RefObject<{ id: string | null, marker: maplibregl.Marker | null }>,
) => {

    if (!item.id || item.lon == null || item.lat == null) return;
    const nextId = String(item.id);
    const current = selectedMarkerRef.current;

    // Keep the existing marker instance for the same selected place to avoid
    // replaying enter animation during harmless list rerenders.
    if (current.marker && current.id === nextId) {
        current.marker.setLngLat([item.lon, item.lat]);
        return;
    }

    // REMOVE OLD MARKER IF EXISTS
    current.marker?.remove();

    const marker = new maplibregl.Marker({
        element: TopPlacePin(item.id, item.cuisine_type ?? undefined),
        anchor: 'center',
    }).setLngLat([item.lon, item.lat]).addTo(map);
    const motion = marker.getElement().querySelector<HTMLElement>('.top-place-pin-motion');
    const shell = marker.getElement().querySelector<HTMLElement>('.top-place-pin-shell');
    motion?.classList.add('is-selected');
    shell?.classList.add('is-selected');
    current.marker = marker;
    current.id = nextId;
};

export default addTempMarker;
